#!/usr/bin/env bash
# ============================================================
# 班级通讯录（Next.js）启动脚本
#
#   应用目录 : /mnt/f/21QianYuanYuan/my-app1
#   监听      : 127.0.0.1:3000（由 nginx 反代到 80）
#   访问地址  : http://192.168.73.33/
#   访问口令  : 见 my-app1/.env.local 里的 SITE_PASSWORD
#
# 每次 WSL 还原 / 重启后，按顺序执行：
#   bash /mnt/f/21QianYuanYuan/db/start-mysql.sh    # 先起数据库（F 盘实例）
#   bash /mnt/f/21QianYuanYuan/my-app1/start-web.sh # 再起网站
# ============================================================
set -u

APP_DIR="/mnt/f/21QianYuanYuan/my-app1"
PORT=3000
PID_FILE="/tmp/addressbook.pid"
LOG_FILE="/tmp/addressbook.log"
# sudo 密码不入库：优先取环境变量 SUDO_PASS，否则运行时交互输入
SUDO_PASS="${SUDO_PASS:-}"

info() { printf '\033[1;34m[INFO]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ OK ]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[FAIL]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }

sudo_run() {
  if [ -z "$SUDO_PASS" ]; then
    sudo -n "$@"
  else
    echo "$SUDO_PASS" | sudo -S -p '' "$@"
  fi
}

ensure_sudo() {
  # 已配置免密 sudo，或环境变量已给出密码时不再询问
  sudo -n true 2>/dev/null && return 0
  [ -n "$SUDO_PASS" ] && return 0
  read -r -s -p "请输入 sudo 密码（不回显，直接回车则跳过 nginx 操作）: " SUDO_PASS
  echo
}

cd "$APP_DIR" || { err "找不到应用目录 $APP_DIR"; exit 1; }

# ------------------------------------------------------------
# 1. 依赖与构建产物
# ------------------------------------------------------------
[ -d node_modules ] || { info "安装依赖 ..."; npm install || exit 1; }

if [ ! -d .next/BUILD_ID ] && [ ! -f .next/BUILD_ID ]; then
  info "未找到构建产物，执行构建 ..."
  npm run build || { err "构建失败"; exit 1; }
fi

# ------------------------------------------------------------
# 2. 已经在跑？
# ------------------------------------------------------------
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  ok "Next.js 已在运行（pid $(cat "$PID_FILE")，端口 $PORT）"
else
  if ss -lnt 2>/dev/null | grep -q "127.0.0.1:$PORT"; then
    warn "端口 $PORT 已被其他进程占用："
    ss -lntp 2>/dev/null | grep "127.0.0.1:$PORT"
  fi

  info "启动 Next.js ..."
  : > "$LOG_FILE"
  nohup ./node_modules/.bin/next start -p "$PORT" -H 127.0.0.1 \
    >> "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/login" 2>/dev/null; then
      ok "Next.js 已就绪（端口 $PORT）"
      break
    fi
    sleep 1
  done

  if ! curl -fsS -o /dev/null "http://127.0.0.1:$PORT/login" 2>/dev/null; then
    err "启动失败，日志 $LOG_FILE："
    tail -n 30 "$LOG_FILE"
    exit 1
  fi
fi

# ------------------------------------------------------------
# 3. 数据库连通性
# ------------------------------------------------------------
DB_USER="$(grep -E '^DB_USER=' .env.local 2>/dev/null | cut -d= -f2-)"
DB_PASS="$(grep -E '^DB_PASSWORD=' .env.local 2>/dev/null | cut -d= -f2-)"
DB_NAME="$(grep -E '^DB_NAME=' .env.local 2>/dev/null | cut -d= -f2-)"
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ]; then
  err "请先补全 $APP_DIR/.env.local 里的 DB_USER / DB_PASSWORD / DB_NAME（模板见 .env.example）"
  exit 1
fi
if mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" \
     -N -B -e "SELECT 1 FROM $DB_NAME.message LIMIT 1;" >/dev/null 2>&1; then
  ok "MySQL 可访问（${DB_NAME:-student}.message）"
else
  err "连不上 MySQL，请先执行 bash /mnt/f/21QianYuanYuan/db/start-mysql.sh"
  exit 1
fi

# ------------------------------------------------------------
# 4. nginx 反代
# ------------------------------------------------------------
if systemctl is-active --quiet nginx; then
  ensure_sudo
  if sudo_run nginx -t >/dev/null 2>&1; then
    sudo_run systemctl reload nginx >/dev/null 2>&1 \
      && ok "nginx 已重载（80 → 127.0.0.1:$PORT）"
  else
    warn "nginx 配置检查未通过，跳过重载（若提示权限不足，可用 SUDO_PASS=... bash $0 重试）"
  fi
else
  warn "nginx 未运行，尝试启动 ..."
  ensure_sudo
  sudo_run systemctl start nginx >/dev/null 2>&1 \
    && ok "nginx 已启动" || warn "nginx 启动失败，请手动检查（若权限不足，可用 SUDO_PASS=... bash $0 重试）"
fi

echo
echo "  访问地址：http://192.168.73.33/"
echo "  本机调试：http://127.0.0.1:3000/"
echo "  账户配置：$APP_DIR/.env.local (ADMIN_* / GUEST_*)"
echo "  运行日志：$LOG_FILE"
echo "  停止服务：kill \$(cat $PID_FILE)"
echo
ok "全部完成 ✅"
