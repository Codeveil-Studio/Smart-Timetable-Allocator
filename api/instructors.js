import { sql, ensureSchema, ok, handleOptions, parseBody, error } from "./_db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(res);
  try {
    await ensureSchema();
    if (req.method === "GET") {
      const rows = await sql`SELECT id, name, course_code, course_name FROM instructors ORDER BY id`;
      return ok(res, rows);
    }
    if (req.method === "POST") {
      const { name, course, courseName } = parseBody(req);
      if (!name || !course || !courseName) return error(res, "Missing fields", 400);
      const rows = await sql`INSERT INTO instructors (name, course_code, course_name) VALUES (${name}, ${course}, ${courseName}) RETURNING id, name, course_code, course_name`;
      return ok(res, rows[0], 201);
    }
    if (req.method === "PUT") {
      const { id, name, course, courseName } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      const rows = await sql`UPDATE instructors SET name=${name}, course_code=${course}, course_name=${courseName} WHERE id=${id} RETURNING id, name, course_code, course_name`;
      return ok(res, rows[0]);
    }
    if (req.method === "DELETE") {
      const { id } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      await sql`DELETE FROM instructors WHERE id=${id}`;
      return ok(res, { ok: true });
    }
    return error(res, "Method not allowed", 405);
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? e.message : "Internal Server Error";
    return error(res, msg, 500);
  }
}
