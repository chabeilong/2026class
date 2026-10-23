import { GENDERS, type Contact } from "@/lib/contacts";
import { NameInput } from "./name-input";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20";
const requiredMark = <span className="text-rose-500">*</span>;

export function ContactFormFields({ contact }: { contact?: Contact }) {
  const key = contact?.id ?? "new";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor={`name-${key}`}>
          姓名 {requiredMark}
        </label>
        <NameInput id={`name-${key}`} defaultValue={contact?.name} />
      </div>

      <div>
        <label className={labelClass} htmlFor={`gender-${key}`}>
          性别
        </label>
        <select
          id={`gender-${key}`}
          name="gender"
          defaultValue={contact?.gender ?? "未知"}
          className={inputClass}
        >
          {GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor={`class-${key}`}>
          班级 {requiredMark}
        </label>
        <input
          id={`class-${key}`}
          name="class_name"
          defaultValue={contact?.class_name}
          maxLength={50}
          required
          placeholder="如：信息2201"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor={`contact-${key}`}>
          联系方式
          <span className="ml-1 text-[10px] font-normal text-slate-400">选填</span>
        </label>
        <input
          id={`contact-${key}`}
          name="contact"
          defaultValue={contact?.contact}
          maxLength={30}
          placeholder="手机号 / 微信号 / QQ（可留空）"
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`remark-${key}`}>
          备注
        </label>
        <textarea
          id={`remark-${key}`}
          name="remark"
          defaultValue={contact?.remark ?? ""}
          maxLength={200}
          rows={2}
          placeholder="宿舍、兴趣爱好等（最多 200 字）"
          className={`${inputClass} resize-y`}
        />
      </div>
    </div>
  );
}
