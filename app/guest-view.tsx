import type { SessionUser } from "@/lib/auth";
import { listContacts } from "@/lib/contacts";
import { logout, saveContact } from "./actions";
import { ContactFormFields } from "./contact-form-fields";
import { ContactList } from "./contact-list";

/** 普通用户：可查看通讯录，并可提交自己的信息（不能改 / 删） */
export async function GuestView({
  user,
  ok,
  error,
}: {
  user: SessionUser;
  ok?: string;
  error?: string;
}) {
  const contacts = await listContacts();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
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
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 sm:flex dark:border-slate-700 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {user.username.slice(0, 1)}
              </span>
              {user.username}
              <span className="text-slate-300">·</span>
              普通用户
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="btn btn-ghost btn-sm"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
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

        <details
          open={Boolean(error)}
          className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-800 dark:text-slate-100">
            <span className="flex items-center gap-2">
              <span className="chip-p3 flex h-6 w-6 items-center justify-center rounded-lg">
                +
              </span>
              登记我的信息
            </span>
            <span className="text-xs font-normal text-slate-400 group-open:hidden">展开</span>
            <span className="hidden text-xs font-normal text-slate-400 group-open:inline">收起</span>
          </summary>

          <form action={saveContact} className="mt-4 space-y-4">
            <ContactFormFields />
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <p className="text-[11px] text-slate-400">
                姓名（≤4 字）和班级为必填；联系方式可留空
              </p>
              <button
                type="submit"
                className="btn btn-primary"
              >
                提交信息
              </button>
            </div>
          </form>
        </details>

        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">通讯录</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">共 {contacts.length} 条记录</p>
        </div>

        <ContactList contacts={contacts} admin={false} emptyHint="展开上方「登记我的信息」添加第一位同学" />

        <p className="pb-8 text-center text-[11px] text-slate-400">
          普通用户可查看通讯录并提交自己的信息，不能修改或删除
        </p>
      </main>
    </div>
  );
}
