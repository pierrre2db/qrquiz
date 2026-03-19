#!/bin/bash
# QR-QUIZ — Procédure de mise à jour
# Usage : bash update.sh
set -e

APP_DIR="/var/www/qrquiz"
cd "$APP_DIR"

echo "=== Mise à jour QR-QUIZ ==="

echo "[1/4] git pull..."
git pull origin main

echo "[2/4] npm install..."
npm install

echo "[3/4] migrations Prisma..."
npx prisma migrate deploy

echo "[4/4] build + redémarrage PM2..."
npm run build
pm2 restart qrquiz

echo ""
echo "=== Mise à jour terminée ! ==="
pm2 status qrquiz
