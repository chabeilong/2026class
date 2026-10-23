# 班级通讯录（Next.js 16 + MySQL）

局域网可直接访问的同学通讯录，数据全部读写本机 MySQL 的 `student.message` 表。
页面通过 nginx 反向代理发布在 **http://192.168.73.33/**。

| 账户 | 密码 | 权限 |
| --- | --- | --- |
| 管理员（`.env.local` 的 `ADMIN_USERNAME`） | 见同一文件的 `ADMIN_PASSWORD` | 增 · 删 · 改 · 查（全部记录） |
| 普通用户（`.env.local` 的 `GUEST_USERNAME`） | 见同一文件的 `GUEST_PASSWORD` | 查看通讯录 + 提交自己的信息（不能改/删） |

> 仓库不保存任何真实口令，账号密码统一放在本机 `.env.local`（已被 `.gitignore` 忽略）。

---

## 一、下次换环境 / WSL 还原后，怎么重新打开

**只需要一条命令**：

```bash
bash /mnt/f/21QianYuanYuan/my-app1/restore.sh
```

它会自动完成：补装缺失的 nginx / mysql / node → 启动 F 盘上的 MySQL → 把 `deploy/nginx-addressbook.conf` 装回 `/etc/nginx` → 必要时 `npm install` / `npm run build` → 启动 Next.js → 自检并打印访问地址。

脚本幂等，服务已经在跑时再执行也安全（只会补齐缺的部分）。

> 前提：`/mnt/f/21QianYuanYuan/` 这两个文件夹要在原位（F 盘不会被 WSL 还原清掉）：
> - `db/` —— MySQL 数据目录 `mysqldata/`（真正的数据）、`start-mysql.sh`、`student.sql`
> - `my-app1/` —— 本网页的全部源码、依赖、构建产物、配置

### 给 AI 助手（或未来的自己）的说明

如果你拿到的只有这两个文件夹，按下面做即可：

1. 确认路径是 `/mnt/f/21QianYuanYuan/{db,my-app1}`（WSL 下 F 盘挂载为 `/mnt/f`）。
2. 执行 `bash /mnt/f/21QianYuanYuan/my-app1/restore.sh`，等它打印「恢复完成」。
3. 校验：`curl -s -o /dev/null -w '%{http_code}' http://192.168.73.33/` 应为 `200`；
   `mysql -h 127.0.0.1 -P 3306 -u mysqlAdmin -p -e "SELECT * FROM student.message;"` 应能出数据。
4. 登录账户见上表；配置在 `my-app1/.env.local`。

### 如果局域网（其他电脑）访问不到

WSL2 需要 Windows 侧把 80 端口转发进 WSL。用**管理员 PowerShell**执行一次：

```powershell
netsh interface portproxy add v4tov6 listenaddress=0.0.0.0 listenport=80 connectaddress=::1 connectport=80
netsh advfirewall firewall add rule name="WSL80" dir=in action=allow protocol=TCP localport=80
```

`C:\Users\<你>\.wslconfig` 里需要保留：

```ini
[wsl2]
[experimental]
hostAddressLoopback=true
```

---

## 二、日常操作

```bash
# 看状态
ss -lnt | grep -E ':(80|3000|3306) '

# 重启网站（改代码或改 .env.local 后）
kill "$(cat /tmp/addressbook.pid)" && bash /mnt/f/21QianYuanYuan/my-app1/start-web.sh

# 重新构建
cd /mnt/f/21QianYuanYuan/my-app1 && npm run build

# 日志
tail -f /tmp/addressbook.log     # Next.js
tail -f /tmp/web-mysql.log       # MySQL

# 数据库
mysql -h 127.0.0.1 -P 3306 -u mysqlAdmin -p student

# 备份数据库
mysqldump -h 127.0.0.1 -P 3306 -u mysqlAdmin -p --databases student \
  > /mnt/f/21QianYuanYuan/db/student.sql
```

> 脚本不保存任何密码：需要 `sudo` 的步骤（重载 nginx、补装依赖）运行时会提示输入；也可临时用 `SUDO_PASS=xxx bash restore.sh` 传入，不会落盘到仓库。

---

## 三、目录与文件说明

```
my-app1/
├── app/
│   ├── page.tsx                入口：按登录状态/角色分发视图
│   ├── login-view.tsx          未登录时的登录表单（直接渲染在 /）
│   ├── guest-view.tsx          普通用户：查看列表 + 提交自己的信息
│   ├── admin-view.tsx          管理员：搜索 + 新增 + 列表（含编辑/删除）
│   ├── contact-list.tsx        通讯录横向列表（管理员多一列「操作」）
│   ├── contact-form-fields.tsx 表单字段（姓名/性别/班级/联系方式/备注）
│   ├── name-input.tsx          姓名输入框：最多 4 字符，拼音输入不打断
│   ├── delete-button.tsx       删除按钮（二次确认）
│   ├── actions.ts              Server Action：登录/退出/保存/删除
│   ├── contacts/[id]/edit/     管理员编辑页
│   └── globals.css             Tailwind + P3 深蓝按钮样式（.btn / .btn-primary / .btn-ghost）
├── lib/
│   ├── db.ts                   mysql2 连接池
│   ├── auth.ts                 账户校验 + HMAC 会话 cookie（12h）
│   └── contacts.ts             message 表读写与统计
├── deploy/
│   └── nginx-addressbook.conf  nginx 站点配置（唯一可信副本）
├── .env.local                  账户密码、会话密钥、数据库连接（改动后需重启）
├── restore.sh                  一键恢复（本文第一节）
├── start-web.sh                只启动网站（假定依赖与 nginx 已就绪）
├── next.config.ts              Next.js 配置
└── node_modules/ .next/        F 盘上的依赖与构建产物（别删，删了 restore.sh 会重建）
```

---

## 四、数据表 `student.message`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | int unsigned, 自增 | 主键 |
| `name` | varchar(50) | 姓名（页面限制 ≤4 字符、必填） |
| `gender` | enum('男','女','未知') | 性别，默认「未知」 |
| `class_name` | varchar(50) | 班级（必填） |
| `contact` | varchar(30) | 联系方式（可留空） |
| `remark` | varchar(200) | 备注 |
| `created_by` | varchar(50) | 录入人账户（`Admin` / `guest`） |
| `created_at` / `updated_at` | timestamp | 自动维护 |

唯一键 `uk_name_class (name, class_name)`：同名同班会被拦住并给出提示。

---

## 五、常见问题

| 现象 | 处理 |
| --- | --- |
| 打开是 nginx 欢迎页 | 站点配置没装好：`bash restore.sh`，或检查 `/etc/nginx/sites-enabled/addressbook` |
| 502 Bad Gateway | Next.js 没起来：`tail -50 /tmp/addressbook.log`，然后 `bash start-web.sh` |
| 页面能开但列表空/报数据库错误 | MySQL 没起：`bash /mnt/f/21QianYuanYuan/db/start-mysql.sh` |
| 3306 被别的 MySQL 占用 | 系统自带 mysql 服务抢了端口：`sudo systemctl stop mysql`（start-mysql.sh 会自动停） |
| 改了密码不生效 | 改的是 `.env.local`，需要 `kill "$(cat /tmp/addressbook.pid)"` 后重跑 `start-web.sh` |
| 地址栏自动补全出 `/login` | 这是浏览器历史，不是站点行为（登录已合并到 `/`）。在建议项上按 `Shift+Delete` 删掉即可 |
| `student.sql` 和数据库不一致 | 重新导出（见第二节备份命令），它是恢复时的兜底 |
