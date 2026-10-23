import mysql from "mysql2/promise";

/**
 * 全局复用连接池，避免 dev 热更新时反复建池。
 * 连接信息来自 .env.local，指向 F 盘上的持久化 MySQL 实例。
 */
const globalForDb = globalThis as unknown as { contactPool?: mysql.Pool };

export const pool =
  globalForDb.contactPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "mysqlAdmin",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "student",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 8,
    // 时间列直接返回字符串，避免时区二次换算
    dateStrings: true,
  });

if (!globalForDb.contactPool) {
  globalForDb.contactPool = pool;
}
