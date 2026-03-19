#!/bin/bash
# QR-QUIZ — Configuration Nginx + HTTPS (Let's Encrypt)
# Usage : sudo bash setup-nginx.sh votre-domaine.com
set -e

DOMAIN="${1:-votre-domaine.com}"
APP_DIR="/var/www/qrquiz"
NGINX_CONF="/etc/nginx/sites-available/qrquiz"

if [ "$DOMAIN" = "votre-domaine.com" ]; then
  echo "ERREUR : Spécifiez votre vrai domaine en paramètre."
  echo "  Usage : bash setup-nginx.sh mon-domaine.com"
  exit 1
fi

echo "=== Configuration Nginx pour $DOMAIN ==="
cat > "$NGINX_CONF" <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/qrquiz
nginx -t
systemctl reload nginx

echo "=== Configuration HTTPS avec Certbot ==="
echo "IMPORTANT : La caméra mobile requiert HTTPS obligatoirement."
certbot --nginx -d "$DOMAIN"

echo ""
echo "=== HTTPS activé ! ==="
echo "Mettez à jour NEXT_PUBLIC_BASE_URL dans .env :"
echo "  NEXT_PUBLIC_BASE_URL=https://$DOMAIN"
echo ""
echo "Puis redémarrez l'application :"
echo "  cd $APP_DIR && npm run build && pm2 restart qrquiz"
