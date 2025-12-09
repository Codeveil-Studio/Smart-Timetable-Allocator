import { sql, ensureSchema, ok, handleOptions, parseBody, error } from "./_db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(res);
  try {
    await ensureSchema();
    if (req.method === "GET") {
      const rows = await sql`SELECT id, code, title, credit_hours FROM courses ORDER BY id`;
      return ok(res, rows);
    }
    if (req.method === "POST") {
      const { code, title, creditHours } = parseBody(req);
      if (!code || !title || creditHours === undefined) return error(res, "Missing fields", 400);
      const rows = await sql`INSERT INTO courses (code, title, credit_hours) VALUES (${code}, ${title}, ${creditHours}) RETURNING id, code, title, credit_hours`;
      return ok(res, rows[0], 201);
    }
    if (req.method === "PUT") {
      const { id, code, title, creditHours } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      const rows = await sql`UPDATE courses SET code=${code}, title=${title}, credit_hours=${creditHours} WHERE id=${id} RETURNING id, code, title, credit_hours`;
      return ok(res, rows[0]);
    }
    if (req.method === "DELETE") {
      const { id } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      await sql`DELETE FROM courses WHERE id=${id}`;
      return ok(res, { ok: true });
    }
    return error(res, "Method not allowed", 405);
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? e.message : "Internal Server Error";
    return error(res, msg, 500);
  }
}
