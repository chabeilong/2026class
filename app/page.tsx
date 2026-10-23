import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AdminView } from "./admin-view";
import { GuestView } from "./guest-view";
import { LoginView } from "./login-view";

export const metadata: Metadata = {
  title: "班级通讯录",
  description: "同学联系方式登记与查询",
};

/**
 * 全部内容都渲染在 “/” 上，按登录状态与角色切换视图。
 * 不再跳转到 /login，避免浏览器把 .../login 记进历史、地址栏自动补全出 login。
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string; u?: string }>;
}) {
  const user = await getSession();
  const params = await searchParams;

  if (!user) {
    return <LoginView error={params.error} u={params.u} />;
  }

  if (user.role !== "admin") {
    return <GuestView user={user} ok={params.ok} error={params.error} />;
  }

  return (
    <AdminView user={user} q={params.q} ok={params.ok} error={params.error} />
  );
}
