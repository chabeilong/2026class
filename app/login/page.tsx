import { redirect } from "next/navigation";

/**
 * 登录界面已合并到 “/”，这里只保留兼容跳转，
 * 供以前收藏 / 历史里的 .../login 链接继续可用。
 */
export default function LoginPage() {
  redirect("/");
}
