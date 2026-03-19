#!/bin/bash
# QR-QUIZ — Installation initiale sur VPS Ubuntu 22.04
# Usage : sudo bash install.sh
set -e

DOMAIN="votre-domaine.com"
APP_DIR="/var/www/qrquiz"
REPO="git@github.com:<user>/qrquiz.git"

echo "=== [1/8] Mise à jour système ==="
apt-get update && apt-get upgrade -y

echo "=== [2/8] Installation des dépendances système ==="
apt-get install -y git nginx certbot python3-certbot-nginx curl

echo "=== [3/8] Installation Node.js 20 LTS via nvm ==="
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi
nvm install 20
nvm use 20
nvm alias default 20

echo "=== [4/8] Installation PM2 ==="
npm install -g pm2

echo "=== [5/8] Installation PostgreSQL 15 ==="
apt-get install -y postgresql-15 postgresql-client-15
systemctl enable postgresql
systemctl start postgresql

echo "=== [6/8] Création base de données ==="
sudo -u postgres psql <<SQL
  CREATE USER qrquiz WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
  CREATE DATABASE qrquiz OWNER qrquiz;
  GRANT ALL PRIVILEGES ON DATABASE qrquiz TO qrquiz;
SQL

echo "=== [7/8] Clonage et configuration de l'application ==="
mkdir -p "$APP_DIR"
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

cp .env.example .env
echo ""
echo ">>> IMPORTANT : Éditez maintenant le fichier .env :"
echo "    nano $APP_DIR/.env"
echo "    Remplissez DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, NEXT_PUBLIC_BASE_URL"
echo ""
read -p "Appuyez sur Entrée après avoir configuré .env..."

mkdir -p "$APP_DIR/data/qrcodes"
chown -R www-data:www-data "$APP_DIR/data"
chmod -R 755 "$APP_DIR/data"

npm install
npx prisma migrate deploy
npx prisma db seed
npm run build

echo "=== [8/8] Démarrage avec PM2 ==="
pm2 start npm --name qrquiz -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=== Installation terminée ! ==="
echo "Configurez maintenant Nginx et HTTPS :"
echo "  bash $APP_DIR/deploy/setup-nginx.sh $DOMAIN"
