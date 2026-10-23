"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticate, endSession, requireAdmin, getSession, startSession } from "@/lib/auth";
import {
  GENDERS,
  createContact,
  deleteContact,
  getContact,
  isDuplicateError,
  updateContact,
  type ContactInput,
  type Gender,
} from "@/lib/contacts";

const NAME_MAX = 4; // 一个汉字 / 一个英文字母都算 1 个字符

function q(params: Record<string, string>): string {
  return `/?${new URLSearchParams(params).toString()}`;
}

function fail(message: string): never {
  redirect(q({ error: message }));
}

function ok(message: string): never {
  redirect(q({ ok: message }));
}

function readInput(formData: FormData): ContactInput | string {
  const name = String(formData.get("name") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "未知").trim();
  const className = String(formData.get("class_name") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const remark = String(formData.get("remark") ?? "").trim();

  if (!name) return "姓名不能为空";
  if ([...name].length > NAME_MAX) return `姓名最多 ${NAME_MAX} 个字符`;
  if (!className) return "班级不能为空";
  if (className.length > 50) return "班级最多 50 个字符";
  if (contact.length > 30) return "联系方式最多 30 个字符";
  if (remark.length > 200) return "备注最多 200 个字符";

  const gender: Gender = (GENDERS as readonly string[]).includes(genderRaw)
    ? (genderRaw as Gender)
    : "未知";

  return { name, gender, class_name: className, contact, remark };
}

export async function login(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = authenticate(username, password);
  if (!user) {
    const search = new URLSearchParams({ error: "账户或密码不正确" });
    if (username.trim()) search.set("u", username.trim());
    redirect(`/?${search.toString()}`);
  }

  await startSession(user);
  redirect("/");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}

export async function saveContact(formData: FormData): Promise<void> {
  const user = await getSession();
  if (!user) redirect("/");

  const id = Number(String(formData.get("id") ?? "0"));
  const isUpdate = Number.isFinite(id) && id > 0;

  // 普通用户只能新增，不能修改
  if (user.role !== "admin") {
    if (isUpdate) fail("普通用户只能新增信息，不能修改");
    if (!formData.get("name")) fail("姓名不能为空");
  }

  const parsed = readInput(formData);
  if (typeof parsed === "string") fail(parsed);

  if (isUpdate) {
    const existing = await getContact(id);
    if (!existing) fail("记录不存在，可能已被其他人删除");
  }

  try {
    if (isUpdate) {
      await updateContact(id, parsed);
    } else {
      await createContact(parsed, user.username);
    }
  } catch (error) {
    if (isDuplicateError(error)) {
      fail(`「${parsed.name}」在「${parsed.class_name}」中已存在，请勿重复添加`);
    }
    console.error("[saveContact] 写入 message 表失败：", error);
    fail("保存失败，请稍后重试（数据库写入异常）");
  }

  revalidatePath("/");
  ok(isUpdate ? "已更新同学信息" : "已提交，管理员可在通讯录中查看");
}

export async function removeContact(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(String(formData.get("id") ?? "0"));
  if (!Number.isFinite(id) || id <= 0) fail("记录 ID 不合法");

  const affected = await deleteContact(id);
  revalidatePath("/");
  ok(affected > 0 ? "已删除该同学信息" : "记录不存在，可能已被其他人删除");
}
