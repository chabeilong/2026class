import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { getStats, listContacts } from "@/lib/contacts";
import { logout, saveContact } from "./actions";
import { ContactFormFields } from "./contact-form-fields";
import { ContactList } from "./contact-list";

/** 管理员：完整通讯录（增删改查） */
export async function AdminView({
  user,
  q,
  ok,
  error,
}: {
  user: SessionUser;
  q?: string;
  ok?: string;
  error?: string;
}) {
  const keyword = (q ?? "").trim();
  const [contacts, stats] = await Promise.all([listContacts(keyword), getStats()]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0b2fa8] to-[#3b63ff] text-sm font-bold text-white shadow-sm">
              通
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                班级通讯录
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                数据源：student.message
              </p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="btn btn-ghost btn-sm"
            >
              退出登录
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {/* 登录用户信息：横向排列 */}
        <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0b2fa8] to-[#3b63ff] text-xs font-semibold uppercase text-white">
              {user.username.slice(0, 1)}
            </span>
            <div className="leading-tight">
              <p className="text-[11px] text-slate-400">当前用户</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {user.username}
              </p>
            </div>
          </div>

          <div className="leading-tight">
            <p className="text-[11px] text-slate-400">角色</p>
            <span className="mt-0.5 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
              管理员
            </span>
          </div>

          <div className="leading-tight">
            <p className="text-[11px] text-slate-400">权限</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">增 · 删 · 改 · 查</p>
          </div>

          <div className="leading-tight">
            <p className="text-[11px] text-slate-400">通讯录总数</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {stats.total} 人 · {stats.classes} 个班级
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
        {ok && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {ok}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form method="get" className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  name="q"
                  defaultValue={keyword}
                  placeholder="搜索姓名 / 班级 / 联系方式 / 备注"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                搜索
              </button>
              {keyword && (
                <Link
                  href="/"
                  className="btn btn-ghost"
                >
                  清除
                </Link>
              )}
            </form>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {keyword ? `「${keyword}」匹配 ${contacts.length} 条` : `共 ${contacts.length} 条记录`}
              {stats.latest ? ` · 最近更新 ${stats.latest}` : ""}
            </p>
          </div>
        </section>

        <details
          open={Boolean(error)}
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-800 dark:text-slate-100">
            <span className="flex items-center gap-2">
              <span className="chip-p3 flex h-6 w-6 items-center justify-center rounded-lg">
                +
              </span>
              添加同学
            </span>
            <span className="text-xs font-normal text-slate-400 group-open:hidden">展开</span>
            <span className="hidden text-xs font-normal text-slate-400 group-open:inline">收起</span>
          </summary>
          <form action={saveContact} className="mt-4 space-y-4">
            <ContactFormFields />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                姓名（≤4 字）与班级为必填，联系方式可留空
              </p>
              <button
                type="submit"
                className="btn btn-primary"
              >
                保存到通讯录
              </button>
            </div>
          </form>
        </details>

        <ContactList contacts={contacts} admin emptyHint="展开上方「添加同学」登记第一位同学" />

        <footer className="pb-8 pt-2 text-center text-[11px] text-slate-400">
          数据实时读写 MySQL · student.message
        </footer>
      </main>
    </div>
  );
}
