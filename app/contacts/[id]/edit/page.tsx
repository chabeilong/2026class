import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getContact } from "@/lib/contacts";
import { saveContact } from "@/app/actions";
import { ContactFormFields } from "@/app/contact-form-fields";

export const metadata: Metadata = {
  title: "编辑同学信息 · 班级通讯录",
};

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const contact = await getContact(numericId);
  if (!contact) notFound();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              编辑同学信息
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              #{contact.id} · 创建于 {contact.created_at}
            </p>
          </div>
          <Link
            href="/"
            className="btn btn-ghost btn-sm"
          >
            返回列表
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <form
          action={saveContact}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <input type="hidden" name="id" value={contact.id} />
          <ContactFormFields contact={contact} />

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-[11px] text-slate-400">
              修改后 updated_at 会自动刷新
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="btn btn-ghost"
              >
                取消
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
              >
                保存修改
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
