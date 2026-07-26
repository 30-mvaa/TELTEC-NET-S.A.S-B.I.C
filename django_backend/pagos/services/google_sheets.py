import json
import logging
import time
from datetime import datetime

from django.db import connection

from configuracion.models import ConfiguracionSistema

logger = logging.getLogger(__name__)

COBROS_COLUMNS = [
    "id_pago", "cedula", "cliente_nombre", "email", "monto",
    "fecha_pago", "metodo_pago", "concepto", "estado",
    "numero_comprobante", "fecha_creacion", "plan", "sector",
]

_sheet_cache = None
_sheet_cache_ts = 0


def _get_config(key, default=None):
    try:
        obj = ConfiguracionSistema.objects.get(clave=key)
        return obj.valor
    except ConfiguracionSistema.DoesNotExist:
        return default


def _get_cobros_sheet():
    global _sheet_cache, _sheet_cache_ts
    now = time.time()
    if _sheet_cache and (now - _sheet_cache_ts) < 300:
        return _sheet_cache

    import gspread
    from google.oauth2.service_account import Credentials

    creds_json = _get_config("google_sheets_credentials")
    sheet_id = _get_config("google_sheets_spreadsheet_id")
    if not creds_json or not sheet_id:
        logger.warning("Google Sheets not configured for cobros")
        return None

    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = Credentials.from_service_account_info(json.loads(creds_json), scopes=scope)
    client = gspread.authorize(creds)
    try:
        _sheet_cache = client.open_by_key(sheet_id).worksheet("Cobros")
        _sheet_cache_ts = now
        return _sheet_cache
    except Exception as e:
        logger.error(f"Cobros tab not found: {e}")
        return None


def _get_cliente_info(cursor, cliente_id):
    cursor.execute("""
        SELECT c.cedula, c.nombres, c.apellidos, c.email,
               COALESCE(s.nombre_sector, '') as sector,
               COALESCE(p.tipo_plan, '') as plan
        FROM clientes c
        LEFT JOIN sectores s ON c.id_sector = s.id_sector
        LEFT JOIN clientes_planes cp ON cp.id_cliente = c.id AND cp.estado = 'activo'
        LEFT JOIN planes p ON cp.id_plan = p.id_plan
        WHERE c.id = %s
    """, [cliente_id])
    row = cursor.fetchone()
    if row:
        return {
            "cedula": row[0] or "",
            "cliente_nombre": f"{row[1] or ''} {row[2] or ''}".strip(),
            "email": row[3] or "",
            "sector": row[4] or "",
            "plan": row[5] or "",
        }
    return {"cedula": "", "cliente_nombre": "", "email": "", "sector": "", "plan": ""}


def sync_pago_to_sheets(pago_id, cliente_id=None):
    sheet = _get_cobros_sheet()
    if not sheet:
        return False

    try:
        with connection.cursor() as cursor:
            if not cliente_id:
                cursor.execute("SELECT cliente_id FROM pagos WHERE id = %s", [pago_id])
                row = cursor.fetchone()
                if not row:
                    return False
                cliente_id = row[0]

            info = _get_cliente_info(cursor, cliente_id)
            cursor.execute("""
                SELECT id, monto, fecha_pago, metodo_pago, concepto, estado,
                       numero_comprobante, fecha_creacion
                FROM pagos WHERE id = %s
            """, [pago_id])
            pago = cursor.fetchone()
            if not pago:
                return False

        row_data = [
            str(pago_id),
            info["cedula"],
            info["cliente_nombre"],
            info["email"],
            str(float(pago[1])) if pago[1] else "",
            str(pago[2]) if pago[2] else "",
            pago[3] or "",
            pago[4] or "",
            pago[5] or "completado",
            pago[6] or "",
            str(pago[7]) if pago[7] else "",
            info["plan"],
            info["sector"],
        ]

        all_values = sheet.get_all_values()
        existing_row = None
        for idx, row in enumerate(all_values):
            if idx == 0:
                continue
            if row[0].strip() == str(pago_id):
                existing_row = idx + 1
                break

        if existing_row:
            for col_idx, value in enumerate(row_data):
                if col_idx < len(COBROS_COLUMNS):
                    sheet.update_cell(existing_row, col_idx + 1, value)
            logger.info(f"Updated pago {pago_id} in cobros sheet row {existing_row}")
        else:
            sheet.append_row(row_data)
            logger.info(f"Appended pago {pago_id} to cobros sheet")

        return True
    except Exception as e:
        logger.error(f"Error syncing pago to cobros sheet: {e}")
        return False


def delete_pago_from_sheets(pago_id):
    sheet = _get_cobros_sheet()
    if not sheet:
        return False

    try:
        all_values = sheet.get_all_values()
        for idx, row in enumerate(all_values):
            if idx == 0:
                continue
            if row[0].strip() == str(pago_id):
                sheet.delete_rows(idx + 1)
                logger.info(f"Deleted pago {pago_id} from cobros sheet row {idx + 1}")
                return True

        logger.info(f"Pago {pago_id} not found in cobros sheet")
        return False
    except Exception as e:
        logger.error(f"Error deleting pago from cobros sheet: {e}")
        return False


def sync_all_pagos_to_sheets():
    sheet = _get_cobros_sheet()
    if not sheet:
        return 0, "Cobros sheet not configured"

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT p.id, p.cliente_id, p.monto, p.fecha_pago, p.metodo_pago,
                   p.concepto, p.estado, p.numero_comprobante, p.fecha_creacion
            FROM pagos p
            ORDER BY p.id
        """)
        pagos = cursor.fetchall()

        cliente_info_cache = {}
        rows_to_append = []
        rows_to_update = []

        existing_ids = set()
        all_values = sheet.get_all_values()
        for idx, row in enumerate(all_values):
            if idx == 0:
                continue
            if row[0].strip():
                existing_ids.add(row[0].strip())

        for pago in pagos:
            pago_id = pago[0]
            cliente_id = pago[1]

            if cliente_id not in cliente_info_cache:
                cliente_info_cache[cliente_id] = _get_cliente_info(cursor, cliente_id)
            info = cliente_info_cache[cliente_id]

            row_data = [
                str(pago_id),
                info["cedula"],
                info["cliente_nombre"],
                info["email"],
                str(float(pago[2])) if pago[2] else "",
                str(pago[3]) if pago[3] else "",
                pago[4] or "",
                pago[5] or "",
                pago[6] or "completado",
                pago[7] or "",
                str(pago[8]) if pago[8] else "",
                info["plan"],
                info["sector"],
            ]

            if str(pago_id) in existing_ids:
                row_num = None
                for idx, row in enumerate(all_values):
                    if idx == 0:
                        continue
                    if row[0].strip() == str(pago_id):
                        row_num = idx + 1
                        break
                if row_num:
                    rows_to_update.append((row_num, row_data))
            else:
                rows_to_append.append(row_data)

        if rows_to_update:
            batch_size = 50
            for i in range(0, len(rows_to_update), batch_size):
                batch = rows_to_update[i:i + batch_size]
                range_list = []
                values = []
                for row_num, row_data in batch:
                    range_list.append(f"A{row_num}:M{row_num}")
                    values.append(row_data)
                sheet.batch_update(
                    [{'range': r, 'values': [v]} for r, v in zip(range_list, values)],
                    value_input_option='USER_ENTERED'
                )
                if i + batch_size < len(rows_to_update):
                    time.sleep(1)

        if rows_to_append:
            batch_size = 100
            for i in range(0, len(rows_to_append), batch_size):
                batch = rows_to_append[i:i + batch_size]
                sheet.append_rows(batch, value_input_option='USER_ENTERED')
                if i + batch_size < len(rows_to_append):
                    time.sleep(1)

    return len(rows_to_append) + len(rows_to_update), f"Appended {len(rows_to_append)}, Updated {len(rows_to_update)}"


def sync_cobros_to_db():
    sheet = _get_cobros_sheet()
    if not sheet:
        return 0, "Google Sheets not configured"

    try:
        all_values = sheet.get_all_values()
    except Exception as e:
        logger.error(f"Error reading cobros sheet: {e}")
        return 0, str(e)

    if len(all_values) < 2:
        return 0, "Sheet is empty"

    headers = [h.strip() for h in all_values[0]]
    created = 0
    updated = 0
    deleted = 0
    errors = []

    sheet_pago_ids = set()

    for row_idx, row in enumerate(all_values[1:], start=2):
        data = {}
        for i, col in enumerate(headers):
            if i < len(row):
                data[col] = row[i].strip() if row[i] else ""

        pago_id = data.get("id_pago", "")
        cedula = data.get("cedula", "")
        monto = data.get("monto", "")

        if not pago_id or not cedula or not monto:
            continue

        if not cedula.isdigit() or len(cedula) != 10:
            errors.append(f"Row {row_idx}: invalid cedula '{cedula}'")
            continue

        try:
            monto_float = float(monto)
        except ValueError:
            errors.append(f"Row {row_idx}: invalid monto '{monto}'")
            continue

        sheet_pago_ids.add(pago_id)

        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM pagos WHERE id = %s", [pago_id])
            existing = cursor.fetchone()

            cursor.execute("SELECT id FROM clientes WHERE cedula = %s", [cedula])
            cliente_row = cursor.fetchone()
            if not cliente_row:
                errors.append(f"Row {row_idx}: client with cedula '{cedula}' not found")
                continue
            cliente_id = cliente_row[0]

            if existing:
                try:
                    cursor.execute("""
                        UPDATE pagos
                        SET monto = %s, fecha_pago = %s, metodo_pago = %s,
                            concepto = %s, estado = %s
                        WHERE id = %s
                    """, [
                        monto_float,
                        data.get("fecha_pago") or None,
                        data.get("metodo_pago", "efectivo"),
                        data.get("concepto", ""),
                        data.get("estado", "completado"),
                        pago_id,
                    ])
                    updated += 1
                except Exception as e:
                    errors.append(f"Row {row_idx} (pago {pago_id}) update: {e}")
            else:
                try:
                    cursor.execute("""
                        INSERT INTO pagos
                            (id, cliente_id, monto, fecha_pago, metodo_pago, concepto,
                             estado, comprobante_enviado, numero_comprobante, fecha_creacion)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, false, %s, NOW())
                    """, [
                        pago_id,
                        cliente_id,
                        monto_float,
                        data.get("fecha_pago") or None,
                        data.get("metodo_pago", "efectivo"),
                        data.get("concepto", ""),
                        data.get("estado", "completado"),
                        data.get("numero_comprobante", ""),
                    ])
                    created += 1
                except Exception as e:
                    errors.append(f"Row {row_idx} (pago {pago_id}) create: {e}")

    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM pagos")
        db_pago_ids = {str(row[0]) for row in cursor.fetchall()}
        to_delete = db_pago_ids - sheet_pago_ids
        for pago_id in to_delete:
            try:
                cursor.execute("SELECT cliente_id FROM pagos WHERE id = %s", [pago_id])
                row = cursor.fetchone()
                cursor.execute("DELETE FROM pagos WHERE id = %s", [pago_id])
                if row:
                    from pagos.views import actualizar_deudas_automaticamente
                    actualizar_deudas_automaticamente(cursor, row[0])
                deleted += 1
            except Exception as e:
                errors.append(f"Delete pago {pago_id}: {e}")

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
