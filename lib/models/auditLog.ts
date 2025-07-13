import { query } from '../database/connection';

export async function saveAuditLog({
  userId,
  role,
  action,
  details,
  sessionId,
}: {
  userId: number;
  role: string;
  action: string;
  details?: string;
  sessionId?: string;
}) {
  await query(
    `INSERT INTO audit_log (user_id, role, action, details, session_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, role, action, details || null, sessionId || null]
  );
} 