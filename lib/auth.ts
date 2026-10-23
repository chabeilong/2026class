import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "admin" | "guest";

export type SessionUser = {
  username: string;
  role: Role;
};

export const SESSION_COOKIE = "ab_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 小时

type Account = {
  username: string;
  password: string;
  role: Role;
};

function secret(): string {
  return process.env.SESSION_SECRET || "insecure-default-secret";
}

function accounts(): Account[] {
  const list: Account[] = [];
  const adminName = (process.env.ADMIN_USERNAME || "Admin").trim();
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  const guestName = (process.env.GUEST_USERNAME || "guest").trim();
  const guestPass = process.env.GUEST_PASSWORD ?? "";

  if (adminPass) list.push({ username: adminName, password: adminPass, role: "admin" });
  if (guestPass) list.push({ username: guestName, password: guestPass, role: "guest" });
  return list;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** 账户 + 密码校验，账户名不区分大小写 */
export function authenticate(username: string, password: string): SessionUser | null {
  const name = username.trim();
  if (!name || !password) return null;

  const account = accounts().find(
    (item) => item.username.toLowerCase() === name.toLowerCase()
  );
  if (!account) return null;
  if (!safeEqual(password, account.password)) return null;

  return { username: account.username, role: account.role };
}

export function createToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: user.username,
      r: user.role,
      exp: Date.now() + SESSION_MAX_AGE * 1000,
    })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string;
      r?: Role;
      exp?: number;
    };
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    if (!data.u || (data.r !== "admin" && data.r !== "guest")) return null;
    return { username: data.u, role: data.r };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return readToken(store.get(SESSION_COOKIE)?.value);
}

/** 未登录 → 回首页（首页会直接渲染登录表单，地址栏不跳转） */
export async function requireLogin(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/");
  return user;
}

/** 非管理员 → 回首页并提示无权限 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireLogin();
  if (user.role !== "admin") {
    redirect(`/?error=${encodeURIComponent("仅管理员可执行该操作")}`);
  }
  return user;
}

export async function startSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
