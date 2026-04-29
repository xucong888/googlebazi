#!/bin/bash
# 悬壶承光 — 一键部署脚本
# 在服务器上首次运行: bash deploy.sh
set -e

DOMAIN="xuanhuchengguang.online"
APP_DIR="/var/www/xuanhuchengguang"
NODE_MIN=18

echo "==> 检查 Node.js 版本..."
NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < $NODE_MIN ? 1 : 0)" 2>&1 && echo ok || echo fail)
if [ "$NODE_VER" = "fail" ]; then
  echo "需要 Node.js $NODE_MIN+，请先安装: https://nodejs.org"
  exit 1
fi

echo "==> 安装 PM2（如未安装）..."
npm install -g pm2 2>/dev/null || true

echo "==> 创建应用目录..."
mkdir -p $APP_DIR

echo "==> 复制项目文件..."
rsync -av --exclude='node_modules' --exclude='.git' --exclude='service-account.json' . $APP_DIR/

echo "==> 安装依赖..."
cd $APP_DIR
npm install --omit=dev

echo "==> 构建前端..."
npm run build

echo "==> 配置 Nginx..."
cp nginx.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx

echo ""
echo "==> 申请 SSL 证书（需要先确保 DNS 已指向此服务器）..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || {
  echo "SSL 申请失败，请手动运行: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}

echo "==> 启动 / 重启应用..."
pm2 delete xuanhuchengguang 2>/dev/null || true
pm2 start server.js --name xuanhuchengguang --env production
pm2 save
pm2 startup

echo ""
echo "✓ 部署完成！访问 https://$DOMAIN"
