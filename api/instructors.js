import { sql, ensureSchema, ok, handleOptions, parseBody, error } from "./_db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(res);

  try {
    // Ensure DB connection
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      throw new Error("Database configuration missing");
    }

    await ensureSchema();

    if (req.method === "GET") {
      const rows = await sql`SELECT id, name FROM instructors ORDER BY id`;
      return ok(res, rows);
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const { name } = body;
      if (!name) return error(res, "Name is required", 400);

      const [row] = await sql`INSERT INTO instructors (name) VALUES (${name}) RETURNING *`;
      return ok(res, row, 201);
    }

    if (req.method === "PUT") {
      const body = parseBody(req);
      const { id, name } = body;
      if (!id || !name) return error(res, "ID and Name are required", 400);

      const [row] = await sql`UPDATE instructors SET name = ${name} WHERE id = ${id} RETURNING *`;
      if (!row) return error(res, "Instructor not found", 404);
      return ok(res, row);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return error(res, "ID is required", 400);

      // Note: CASCADE might delete linked courses or set null depending on FK setup.
      // Since we didn't specify ON DELETE CASCADE in _db.js, this might fail if courses exist.
      // But user said "remove CRUD operations other than this", implying simple logic.
      // We'll try to delete.
      try {
        const [row] = await sql`DELETE FROM instructors WHERE id = ${id} RETURNING *`;
        if (!row) return error(res, "Instructor not found", 404);
        return ok(res, row);
      } catch (e) {
        if (e.code === '23503') { // Foreign key violation
             return error(res, "Cannot delete instructor assigned to courses", 409);
        }
        throw e;
      }
    }

    return error(res, "Method not allowed", 405);
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? e.message : "Internal Server Error";
    console.error("API Error:", msg);
    return error(res, msg, 500);
  }
}
