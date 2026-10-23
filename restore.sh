#!/usr/bin/env bash
# ============================================================
# 班级通讯录 —— 一键恢复脚本（WSL 重装 / 还原 / 换机后执行）
#
#   bash /mnt/f/21QianYuanYuan/my-app1/restore.sh
#
# 它会把「F 盘上持久化的部分」重新接回系统：
#   1. 检查并补装 nginx / mysql / node（系统盘被重置时会缺）
#   2. 用 db/start-mysql.sh 启动 F 盘上的 MySQL 实例（3306）
#   3. 把 deploy/nginx-addressbook.conf 装回 /etc/nginx 并启用
#   4. 必要时 npm install / npm run build（node_modules、.next 都在 F 盘）
#   5. 启动 Next.js（127.0.0.1:3000）+ 重载 nginx
#   6. 自检：数据库、站点、Windows 端口转发
#
# 幂等：已经在跑的时候再执行也安全。
# ============================================================
set -u

APP_DIR="/mnt/f/21QianYuanYuan/my-app1"
DB_DIR="/mnt/f/21QianYuanYuan/db"
PORT=3000
# sudo 密码不入库：优先取环境变量 SUDO_PASS，否则运行时交互输入
SUDO_PASS="${SUDO_PASS:-}"
LAN_IP="192.168.73.33"

info() { printf '\033[1;34m[INFO]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ OK ]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[FAIL]\033[0m %s\n' "$*"; }

_sudo_ready=0
ensure_sudo() {
  [ "$_sudo_ready" = "1" ] && return 0
  _sudo_ready=1
  # 免密 sudo 或已通过环境变量提供密码时，无需询问
  sudo -n true 2>/dev/null && return 0
  [ -n "$SUDO_PASS" ] && return 0
  read -r -s -p "请输入 sudo 密码（不回显）: " SUDO_PASS || true
  echo
}

sudo_run() {
  ensure_sudo
  if [ -z "$SUDO_PASS" ]; then
    sudo -n "$@"
  else
    echo "$SUDO_PASS" | sudo -S -p '' "$@"
  fi
}
have() { command -v "$1" >/dev/null 2>&1; }

echo
echo "=============================================="
echo " 班级通讯录 · 一键恢复"
echo "=============================================="

[ -d "$APP_DIR" ] || { err "找不到应用目录 $APP_DIR"; exit 1; }
[ -d "$DB_DIR/mysqldata" ] || { err "找不到数据库目录 $DB_DIR/mysqldata"; exit 1; }
cd "$APP_DIR" || exit 1

# 提前询问 sudo 密码，避免后续步骤把提示重定向掉
ensure_sudo

# ------------------------------------------------------------
# 1. 系统依赖
# ------------------------------------------------------------
info "检查系统依赖（nginx / mysql / node / curl）"

NEED_APT=0
have nginx          || NEED_APT=1
[ -x /usr/sbin/mysqld ] || NEED_APT=1
have curl           || NEED_APT=1

if [ "$NEED_APT" = "1" ]; then
  warn "缺少组件，开始安装（需要联网，可能耗时几分钟）"
  sudo_run apt-get update -y >/dev/null 2>&1
  have curl              || sudo_run apt-get install -y curl
  have nginx             || sudo_run apt-get install -y nginx
  [ -x /usr/sbin/mysqld ] || sudo_run apt-get install -y mysql-server
  ok "依赖安装完成"
else
  ok "依赖齐全（nginx / mysqld / curl）"
fi

# Node：Next.js 16 需要 20.9+，版本不够时用 NodeSource 装 22 LTS
node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

if have node && have npm && [ "$(node_major)" -ge 20 ] 2>/dev/null; then
  ok "Node $(node -v)"
else
  warn "Node 缺失或版本过低（当前：$(have node && node -v || echo 无)），安装 Node 22 LTS ..."
  if curl -fsSL https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh 2>/dev/null; then
    sudo_run bash /tmp/nodesource_setup.sh >/dev/null 2>&1
    sudo_run apt-get install -y nodejs || { err "Node 安装失败"; exit 1; }
  else
    warn "无法访问 NodeSource，退回系统源"
    sudo_run apt-get install -y nodejs npm || { err "Node 安装失败"; exit 1; }
  fi
  ok "Node $(node -v)"
fi

# ------------------------------------------------------------
# 2. 数据库（F 盘实例，3306）
# ------------------------------------------------------------
info "启动 MySQL（数据目录 $DB_DIR/mysqldata）"
if bash "$DB_DIR/start-mysql.sh"; then
  ok "MySQL 就绪"
else
  err "MySQL 启动失败，请看上面的输出或 /tmp/web-mysql.log"
  exit 1
fi

# 读 .env.local 里的库账号
DB_USER="$(grep -E '^DB_USER=' "$APP_DIR/.env.local" 2>/dev/null | cut -d= -f2-)"
DB_PASS="$(grep -E '^DB_PASSWORD=' "$APP_DIR/.env.local" 2>/dev/null | cut -d= -f2-)"
DB_NAME="$(grep -E '^DB_NAME=' "$APP_DIR/.env.local" 2>/dev/null | cut -d= -f2-)"
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ]; then
  err "请先补全 $APP_DIR/.env.local 里的 DB_USER / DB_PASSWORD / DB_NAME（模板见 .env.example）"
  exit 1
fi

if mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" \
     -N -B -e "SELECT 1 FROM \`$DB_NAME\`.\`message\` LIMIT 1;" >/dev/null 2>&1; then
  ROWS="$(mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" -N -B \
          -e "SELECT COUNT(*) FROM \`$DB_NAME\`.\`message\`;" 2>/dev/null)"
  ok "数据库可用：${DB_NAME}.message（${ROWS:-0} 条记录）"
elif [ -f "$DB_DIR/student.sql" ]; then
  warn "数据库/表不存在，尝试从 $DB_DIR/student.sql 导入 ..."
  mysql -h 127.0.0.1 -P 3306 -u "$DB_USER" -p"$DB_PASS" < "$DB_DIR/student.sql" \
    && ok "已导入 student.sql" \
    || { err "导入失败"; exit 1; }
else
  err "连不上 ${DB_NAME}.message，且没有 student.sql 可导入"
  exit 1
fi

# ------------------------------------------------------------
# 3. nginx 反向代理（80 → 127.0.0.1:3000）
# ------------------------------------------------------------
CONF_SRC="$APP_DIR/deploy/nginx-addressbook.conf"
CONF_DST="/etc/nginx/sites-available/addressbook"

if [ -f "$CONF_SRC" ]; then
  if [ -f "$CONF_DST" ] && cmp -s "$CONF_SRC" "$CONF_DST"; then
    ok "nginx 站点配置已是最新"
  else
    info "安装 nginx 站点配置 ..."
    sudo_run cp "$CONF_SRC" "$CONF_DST"
    ok "已写入 $CONF_DST"
  fi
  sudo_run ln -sf "$CONF_DST" /etc/nginx/sites-enabled/addressbook
  sudo_run rm -f /etc/nginx/sites-enabled/default
else
  warn "缺少 $CONF_SRC，跳过 nginx 站点配置"
fi

if systemctl is-active --quiet nginx; then
  if sudo_run nginx -t >/dev/null 2>&1; then
    sudo_run systemctl reload nginx && ok "nginx 已重载"
  else
    err "nginx 配置检查失败："
    sudo_run nginx -t
    exit 1
  fi
else
  info "启动 nginx ..."
  sudo_run systemctl enable --now nginx >/dev/null 2>&1 \
    && ok "nginx 已启动" || { err "nginx 启动失败"; exit 1; }
fi

# ------------------------------------------------------------
# 4. 依赖与构建
# ------------------------------------------------------------
if [ ! -d node_modules ]; then
  info "安装前端依赖（npm install）..."
  npm install || { err "npm install 失败"; exit 1; }
  ok "依赖安装完成"
else
  ok "node_modules 已存在"
fi

NEED_BUILD=0
[ -f .next/BUILD_ID ] || NEED_BUILD=1
if [ "$NEED_BUILD" = "0" ]; then
  CHANGED="$(find app lib deploy next.config.ts package.json -newer .next/BUILD_ID 2>/dev/null | head -1)"
  [ -n "$CHANGED" ] && NEED_BUILD=1
fi

if [ "$NEED_BUILD" = "1" ]; then
  info "源码有更新或缺少产物，执行构建（约 30 秒）..."
  npm run build || { err "构建失败"; exit 1; }
  ok "构建完成"

  # 重新构建后旧进程仍在跑旧产物，必须重启才能生效
  if [ -f /tmp/addressbook.pid ] && kill -0 "$(cat /tmp/addressbook.pid)" 2>/dev/null; then
    info "重启网站以加载新构建 ..."
    kill "$(cat /tmp/addressbook.pid)" 2>/dev/null
    sleep 2
  fi
else
  ok "构建产物已是最新"
fi

# ------------------------------------------------------------
# 5. 启动网站
# ------------------------------------------------------------
info "启动 Next.js ..."
bash "$APP_DIR/start-web.sh" || { err "网站启动失败，日志：/tmp/addressbook.log"; exit 1; }

# ------------------------------------------------------------
# 6. 自检
# ------------------------------------------------------------
echo
info "自检"

CODE_LOCAL="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/" 2>/dev/null)"
[ "$CODE_LOCAL" = "200" ] && ok "本机 http://127.0.0.1/ → 200" || warn "本机访问返回 $CODE_LOCAL"

CODE_LAN="$(curl -s -o /dev/null -w '%{http_code}' "http://$LAN_IP/" 2>/dev/null)"
if [ "$CODE_LAN" = "200" ]; then
  ok "局域网 http://$LAN_IP/ → 200"
else
  warn "局域网 IP 访问返回 $CODE_LAN（可能缺 Windows 端口转发，见下方提示）"
fi

# Windows 侧 80 端口转发（WSL2 需要它才能被局域网访问）
if have powershell.exe; then
  if powershell.exe -NoProfile -Command "netsh interface portproxy show all" 2>/dev/null | grep -q " 80 "; then
    ok "Windows 端口转发 80 已存在"
  else
    warn "Windows 未配置 80 端口转发，局域网可能访问不到。用【管理员 PowerShell】执行："
    echo "     netsh interface portproxy add v4tov6 listenaddress=0.0.0.0 listenport=80 connectaddress=::1 connectport=80"
    echo "     netsh advfirewall firewall add rule name=\"WSL80\" dir=in action=allow protocol=TCP localport=80"
  fi
fi

echo
echo "=============================================="
ok "恢复完成"
echo
ADMIN_USER="$(grep -E '^ADMIN_USERNAME=' "$APP_DIR/.env.local" 2>/dev/null | cut -d= -f2-)"
GUEST_USER="$(grep -E '^GUEST_USERNAME=' "$APP_DIR/.env.local" 2>/dev/null | cut -d= -f2-)"
echo "  访问地址：http://$LAN_IP/"
echo "  管理员  ：${ADMIN_USER:-ADMIN_USERNAME}（口令见 .env.local 的 ADMIN_PASSWORD）"
echo "  普通用户：${GUEST_USER:-GUEST_USERNAME}（口令见 .env.local 的 GUEST_PASSWORD）"
echo
echo "  数据库  ：127.0.0.1:3306  ${DB_NAME}.message"
echo "  应用日志：/tmp/addressbook.log"
echo "  MySQL日志：/tmp/web-mysql.log"
echo "  停止网站：kill \"\$(cat /tmp/addressbook.pid)\""
echo "  停止数据库：kill \"\$(cat /tmp/web-mysql.pid)\""
echo "=============================================="
