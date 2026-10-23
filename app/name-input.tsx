"use client";

import { useRef, useState } from "react";

const NAME_MAX = 4;

/**
 * 姓名输入框：最多 4 个字符（汉字 / 英文字母 / 数字都算 1 个）。
 * 拼音输入法「上屏前」的字母不参与计数与截断，避免打拼音时被打断。
 */
export function NameInput({
  id,
  defaultValue = "",
}: {
  id: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const composing = useRef(false);
  const count = [...value].length;
  const overflow = count >= NAME_MAX;

  function clamp(text: string): string {
    return [...text].slice(0, NAME_MAX).join("");
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name="name"
          value={value}
          required
          autoComplete="off"
          placeholder="如：张三"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
          onChange={(event) => {
            const next = event.currentTarget.value;
            // 拼音组合中不截断，等上屏后再按字符数处理
            setValue(composing.current ? next : clamp(next));
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            setValue(clamp(event.currentTarget.value));
          }}
        />
        <span
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium ${
            overflow ? "text-rose-500" : "text-slate-400"
          }`}
        >
          {Math.min(count, NAME_MAX)}/{NAME_MAX}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">
        最多 4 个字符（一个汉字、一个英文字母都算 1 个；拼音输入过程不计）
      </p>
    </div>
  );
}
