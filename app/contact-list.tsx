import Link from "next/link";
import type { Contact } from "@/lib/contacts";
import { DeleteButton } from "./delete-button";

const genderStyle: Record<Contact["gender"], string> = {
  男: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  女: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:ring-pink-500/30",
  未知:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
};

const CELL = "min-w-0";
const MOBILE_LABEL = "text-[11px] text-slate-400 sm:hidden";

const GRID_ADMIN =
  "sm:grid-cols-[minmax(0,1.25fr)_minmax(0,.85fr)_minmax(0,1fr)_minmax(0,1.15fr)_86px_120px_140px]";
const GRID_READONLY =
  "sm:grid-cols-[minmax(0,1.3fr)_minmax(0,.9fr)_minmax(0,1.05fr)_minmax(0,1.25fr)_90px_125px]";

/** 通讯录横向列表：管理员多一列「操作」 */
export function ContactList({
  contacts,
  admin,
  emptyHint,
}: {
  contacts: Contact[];
  admin: boolean;
  emptyHint: string;
}) {
  const grid = admin ? GRID_ADMIN : GRID_READONLY;

  if (contacts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">通讯录还是空的</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{emptyHint}</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* 表头 */}
      <div
        className={`hidden gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-[11px] font-medium text-slate-500 sm:grid dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400 ${grid}`}
      >
        <span>姓名</span>
        <span>班级</span>
        <span>联系方式</span>
        <span>备注</span>
        <span>录入人</span>
        <span>更新时间</span>
        {admin && <span className="text-right">操作</span>}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`grid grid-cols-1 gap-1.5 px-4 py-3 transition hover:bg-slate-50/70 sm:items-center sm:gap-3 dark:hover:bg-slate-800/40 ${grid}`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-600 dark:from-slate-700 dark:to-slate-800 dark:text-slate-200">
                {contact.name.slice(0, 1)}
              </span>
              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {contact.name}
              </span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${genderStyle[contact.gender]}`}
              >
                {contact.gender}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-slate-300 sm:hidden dark:text-slate-600">
                #{contact.id}
              </span>
            </div>

            <div className={`${CELL} flex items-center justify-between gap-3 sm:block`}>
              <span className={MOBILE_LABEL}>班级</span>
              <span className="truncate text-sm text-slate-700 dark:text-slate-200">
                {contact.class_name}
              </span>
            </div>

            <div className={`${CELL} flex items-center justify-between gap-3 sm:block`}>
              <span className={MOBILE_LABEL}>联系方式</span>
              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {contact.contact || "—"}
              </span>
            </div>

            <div className={`${CELL} flex items-start justify-between gap-3 sm:block`}>
              <span className={`${MOBILE_LABEL} mt-0.5 shrink-0`}>备注</span>
              <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                {contact.remark || "—"}
              </span>
            </div>

            <div className={`${CELL} flex items-center justify-between gap-3 sm:block`}>
              <span className={MOBILE_LABEL}>录入人</span>
              <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                {contact.created_by}
              </span>
            </div>

            <div className={`${CELL} flex items-center justify-between gap-3 sm:block`}>
              <span className={MOBILE_LABEL}>更新时间</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {contact.updated_at}
              </span>
            </div>

            {admin && (
              <div className="mt-1 flex items-center justify-end gap-1 sm:mt-0">
                <Link
                  href={`/contacts/${contact.id}/edit`}
                  className="btn btn-ghost btn-sm"
                >
                  编辑
                </Link>
                <DeleteButton id={contact.id} name={contact.name} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
