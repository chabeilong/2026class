import { login } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20";

/** 未登录时直接渲染在 “/” 上，地址栏不跳转到 /login */
export function LoginView({ error, u }: { error?: string; u?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-indigo-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b2fa8] to-[#3b63ff] text-lg font-bold text-white shadow-lg shadow-[#0b2fa8]/25">
            通
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            班级通讯录
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            请使用账户和密码登录
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <form action={login} className="space-y-4">
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                账户
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                defaultValue={u ?? ""}
                placeholder="请输入账户"
                className={fieldClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="请输入密码"
                className={fieldClass}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
            >
              登录
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/70 px-3 py-2.5 dark:border-indigo-500/30 dark:bg-indigo-500/10">
            <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              普通用户（可直接登录，仅可提交自己的信息）
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              账户{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                guest
              </code>
              <span className="mx-1.5 text-slate-400">·</span>
              密码{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                123456
              </code>
            </p>
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            管理员请使用 Admin 账户登录
          </p>
        </div>
      </div>
    </div>
  );
}
