import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db";

export const GENDERS = ["男", "女", "未知"] as const;
export type Gender = (typeof GENDERS)[number];

export type Contact = {
  id: number;
  name: string;
  gender: Gender;
  class_name: string;
  contact: string;
  remark: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ContactInput = {
  name: string;
  gender: Gender;
  class_name: string;
  contact: string;
  remark: string;
};

export type Stats = {
  total: number;
  male: number;
  female: number;
  classes: number;
  latest: string | null;
};

const FIELDS = `
  id, name, gender, class_name, contact, remark, created_by,
  DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at,
  DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS updated_at
`;

export async function listContacts(keyword = ""): Promise<Contact[]> {
  const q = keyword.trim();
  if (q) {
    const like = `%${q}%`;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ${FIELDS} FROM message
        WHERE name LIKE ? OR class_name LIKE ? OR contact LIKE ? OR IFNULL(remark, '') LIKE ?
        ORDER BY class_name ASC, id ASC
        LIMIT 500`,
      [like, like, like, like]
    );
    return rows as Contact[];
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${FIELDS} FROM message ORDER BY class_name ASC, id ASC LIMIT 500`
  );
  return rows as Contact[];
}

export async function getContact(id: number): Promise<Contact | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${FIELDS} FROM message WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows[0] as Contact | undefined) ?? null;
}

export async function getStats(): Promise<Stats> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
        COUNT(*) AS total,
        SUM(gender = '男') AS male,
        SUM(gender = '女') AS female,
        COUNT(DISTINCT class_name) AS classes,
        DATE_FORMAT(MAX(updated_at), '%Y-%m-%d %H:%i') AS latest
     FROM message`
  );
  const row = rows[0] ?? {};
  return {
    total: Number(row.total ?? 0),
    male: Number(row.male ?? 0),
    female: Number(row.female ?? 0),
    classes: Number(row.classes ?? 0),
    latest: (row.latest as string | null) ?? null,
  };
}

export async function createContact(input: ContactInput, createdBy: string): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO message (name, gender, class_name, contact, remark, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.name, input.gender, input.class_name, input.contact, input.remark || null, createdBy]
  );
  return result.insertId;
}



export async function updateContact(id: number, input: ContactInput): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE message
        SET name = ?, gender = ?, class_name = ?, contact = ?, remark = ?
      WHERE id = ?`,
    [input.name, input.gender, input.class_name, input.contact, input.remark || null, id]
  );
  return result.affectedRows;
}

export async function deleteContact(id: number): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(`DELETE FROM message WHERE id = ?`, [id]);
  return result.affectedRows;
}

export function isDuplicateError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ER_DUP_ENTRY"
  );
}
