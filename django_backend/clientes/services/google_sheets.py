import json
import logging
from datetime import datetime

from django.conf import settings
from django.db import connection

from configuracion.models import ConfiguracionSistema

logger = logging.getLogger(__name__)

SHEET_COLUMNS = [
    "cedula", "nombres", "apellidos", "fecha_nacimiento",
    "direccion", "email", "telefono", "estado",
    "fecha_registro", "id_sector", "sector_nombre", "plan_actual",
]


def _get_config(key, default=None):
    try:
        obj = ConfiguracionSistema.objects.get(clave=key)
        return obj.valor
    except ConfiguracionSistema.DoesNotExist:
        return default


def _get_sheet():
    import gspread
    from google.oauth2.service_account import Credentials

    creds_json = _get_config("google_sheets_credentials")
    sheet_id = _get_config("google_sheets_spreadsheet_id")
    if not creds_json or not sheet_id:
        logger.warning("Google Sheets not configured: missing credentials or spreadsheet ID")
        return None

    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_info(json.loads(creds_json), scopes=scope)
    client = gspread.authorize(creds)
    return client.open_by_key(sheet_id).sheet1


def _cliente_to_row(cliente):
    from sectores_app.models import Sector
    sector = None
    if cliente.id_sector:
        sector = Sector.objects.filter(id=cliente.id_sector).first()
    return [
        cliente.cedula or "",
        cliente.nombres or "",
        cliente.apellidos or "",
        str(cliente.fecha_nacimiento or ""),
        cliente.direccion or "",
        cliente.email or "",
        cliente.telefono or "",
        cliente.estado or "activo",
        str(cliente.fecha_registro or ""),
        str(cliente.id_sector or ""),
        sector.nombre_sector if sector else "",
        "",
    ]


def _row_to_cliente_data(row, headers):
    data = {}
    for i, col in enumerate(headers):
        if i < len(row):
            data[col.strip()] = row[i].strip() if row[i] else ""
    return data


def _find_row_by_cedula(sheet, cedula, headers):
    try:
        cedula_col = headers.index("cedula")
    except ValueError:
        return None
    all_values = sheet.get_all_values()
    for idx, row in enumerate(all_values):
        if idx == 0:
            continue
        if len(row) > cedula_col and row[cedula_col].strip() == cedula:
            return idx + 1
    return None


def sync_cliente_to_sheets(cliente):
    sheet = _get_sheet()
    if not sheet:
        return False

    try:
        headers = sheet.row_values(1)
        if not headers:
            sheet.append_row(SHEET_COLUMNS)
            headers = SHEET_COLUMNS

        row_data = _cliente_to_row(cliente)
        existing_row = _find_row_by_cedula(sheet, cliente.cedula, headers)

        if existing_row:
            for col_idx, value in enumerate(row_data):
                if col_idx < len(headers):
                    sheet.update_cell(existing_row, col_idx + 1, value)
            logger.info(f"Updated row {existing_row} for cliente {cliente.cedula}")
        else:
            sheet.append_row(row_data)
            logger.info(f"Appended row for cliente {cliente.cedula}")

        return True
    except Exception as e:
        logger.error(f"Error syncing cliente to sheets: {e}")
        return False


def sync_sheets_to_db():
    sheet = _get_sheet()
    if not sheet:
        return 0, "Google Sheets not configured"

    try:
        all_values = sheet.get_all_values()
    except Exception as e:
        logger.error(f"Error reading sheet: {e}")
        return 0, str(e)

    if len(all_values) < 2:
        return 0, "Sheet is empty"

    headers = [h.strip() for h in all_values[0]]
    created = 0
    updated = 0
    deleted = 0
    errors = []

    sheet_cedulas = set()

    for row_idx, row in enumerate(all_values[1:], start=2):
        data = _row_to_cliente_data(row, headers)
        cedula = data.get("cedula", "")

        if not cedula:
            continue

        if not cedula.isdigit() or len(cedula) != 10:
            errors.append(f"Row {row_idx}: invalid cedula '{cedula}'")
            continue

        sheet_cedulas.add(cedula)

        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM clientes WHERE cedula = %s", [cedula])
            existing = cursor.fetchone()

            if existing:
                try:
                    cursor.execute("""
                        UPDATE clientes
                        SET nombres = %s, apellidos = %s, fecha_nacimiento = %s,
                            direccion = %s, email = %s, telefono = %s,
                            estado = %s, id_sector = %s
                        WHERE cedula = %s
                    """, [
                        data.get("nombres", ""),
                        data.get("apellidos", ""),
                        data.get("fecha_nacimiento") or None,
                        data.get("direccion", ""),
                        data.get("email", ""),
                        data.get("telefono", ""),
                        data.get("estado", "activo"),
                        data.get("id_sector") or None,
                        cedula,
                    ])
                    updated += 1
                except Exception as e:
                    errors.append(f"Row {row_idx} ({cedula}) update: {e}")
            else:
                try:
                    cursor.execute("""
                        INSERT INTO clientes
                            (cedula, nombres, apellidos, fecha_nacimiento, direccion,
                             email, telefono, estado, fecha_registro, id_sector)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, [
                        cedula,
                        data.get("nombres", ""),
                        data.get("apellidos", ""),
                        data.get("fecha_nacimiento") or None,
                        data.get("direccion", ""),
                        data.get("email", ""),
                        data.get("telefono", ""),
                        data.get("estado", "activo"),
                        datetime.now(),
                        data.get("id_sector") or None,
                    ])
                    created += 1
                    logger.info(f"Created cliente {cedula} from sheet row {row_idx}")
                except Exception as e:
                    errors.append(f"Row {row_idx} ({cedula}) create: {e}")

    with connection.cursor() as cursor:
        cursor.execute("SELECT cedula FROM clientes")
        db_cedulas = {row[0] for row in cursor.fetchall()}
        to_delete = db_cedulas - sheet_cedulas
        for cedula in to_delete:
            try:
                cursor.execute("DELETE FROM clientes WHERE cedula = %s", [cedula])
                deleted += 1
                logger.info(f"Deleted cliente {cedula} from DB (removed from sheet)")
            except Exception as e:
                errors.append(f"Delete {cedula}: {e}")

    summary = []
    if created:
        summary.append(f"Created {created}")
    if updated:
        summary.append(f"Updated {updated}")
    if deleted:
        summary.append(f"Deleted {deleted}")
    msg = "; ".join(summary) if summary else "No changes"
    err_msg = "; ".join(errors[:5]) if errors else ""
    if err_msg:
        msg += f" | Errors: {err_msg}"
    return (created + updated + deleted), msg


def delete_cliente_from_sheets(cedula):
    sheet = _get_sheet()
    if not sheet:
        return False

    try:
        headers = sheet.row_values(1)
        if not headers:
            return False

        row = _find_row_by_cedula(sheet, cedula, headers)
        if row:
            sheet.delete_rows(row)
            logger.info(f"Deleted row {row} for cliente {cedula} from sheets")
            return True

        logger.info(f"Cliente {cedula} not found in sheets, nothing to delete")
        return False
    except Exception as e:
        logger.error(f"Error deleting cliente from sheets: {e}")
        return False
