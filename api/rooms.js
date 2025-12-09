import { sql, ensureSchema, ok, handleOptions, parseBody, error } from "./_db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return handleOptions(res);
  try {
    await ensureSchema();
    if (req.method === "GET") {
      const rows = await sql`SELECT id, room_number, room_type FROM rooms ORDER BY id`;
      return ok(res, rows);
    }
    if (req.method === "POST") {
      const { roomNumber, roomType } = parseBody(req);
      if (!roomNumber || !roomType) return error(res, "Missing fields", 400);
      const rows = await sql`INSERT INTO rooms (room_number, room_type) VALUES (${roomNumber}, ${roomType}) RETURNING id, room_number, room_type`;
      return ok(res, rows[0], 201);
    }
    if (req.method === "PUT") {
      const { id, roomNumber, roomType } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      const rows = await sql`UPDATE rooms SET room_number=${roomNumber}, room_type=${roomType} WHERE id=${id} RETURNING id, room_number, room_type`;
      return ok(res, rows[0]);
    }
    if (req.method === "DELETE") {
      const { id } = parseBody(req);
      if (!id) return error(res, "Missing id", 400);
      await sql`DELETE FROM rooms WHERE id=${id}`;
      return ok(res, { ok: true });
    }
    return error(res, "Method not allowed", 405);
  } catch (e) {
    const msg = e && typeof e === "object" && "message" in e ? e.message : "Internal Server Error";
    return error(res, msg, 500);
  }
}
