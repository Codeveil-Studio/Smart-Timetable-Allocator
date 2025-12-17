import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const buildUrl = () => {
  const host = process.env.DB_HOST || "";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "";
  const password = process.env.DB_PASSWORD || "";
  const db = process.env.DB_NAME || "";
  const ssl = process.env.DB_SSL;
  if (!host || !user || !db) return process.env.DATABASE_URL || "";
  const sslQuery = ssl && ssl !== "false" ? "?sslmode=require" : "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}${sslQuery}`;
};

export const sql = neon(buildUrl());

export const ensureSchema = async () => {
  // Re-create instructors table to match new schema: id, name
  // Removed DROP TABLE to persist data
  await sql`CREATE TABLE IF NOT EXISTS instructors (
    id serial PRIMARY KEY,
    name text NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS rooms (
    id serial PRIMARY KEY,
    room_number text NOT NULL,
    room_type text NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS courses (
    id serial PRIMARY KEY,
    code text NOT NULL,
    title text NOT NULL,
    credit_hours integer NOT NULL,
    instructor_id integer REFERENCES instructors(id)
  )`;
  
  // Add instructor_id if it was missing in existing courses table
  try {
    await sql`ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id integer REFERENCES instructors(id)`;
  } catch (e) {
    // Ignore error if column exists or other issue
    console.log("Migration note: " + e.message);
  }
};

export const ok = (res, data, status = 200) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).json(data);
};

export const handleOptions = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
};

export const parseBody = (req) => {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (req.body && typeof req.body === "string" && req.body.length) return JSON.parse(req.body);
    return {};
  } catch {
    return {};
  }
};

export const error = (res, message, status = 500) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).json({ error: message });
};
