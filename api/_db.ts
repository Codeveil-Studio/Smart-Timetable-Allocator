import { neon } from "@neondatabase/serverless";

const buildUrl = () => {
  const host = process.env.DB_HOST || "";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "";
  const password = process.env.DB_PASSWORD || "";
  const db = process.env.DB_NAME || "";
  if (!host || !user || !db) return process.env.DATABASE_URL || "";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
};

export const sql = neon(buildUrl());

export const ensureSchema = async () => {
  await sql`CREATE TABLE IF NOT EXISTS instructors (
    id serial PRIMARY KEY,
    name text NOT NULL,
    course_code text NOT NULL,
    course_name text NOT NULL
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
    credit_hours integer NOT NULL
  )`;
};

export const ok = (res: any, data: any, status = 200) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(status).json(data);
};

export const handleOptions = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
};
