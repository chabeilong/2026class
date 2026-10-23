"use client";

import { removeContact } from "./actions";

export function DeleteButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={removeContact}
      onSubmit={(event) => {
        if (!window.confirm(`确定从通讯录删除「${name}」吗？此操作不可撤销。`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="btn btn-ghost btn-sm"
      >
        删除
      </button>
    </form>
  );
}
