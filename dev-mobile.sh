#!/bin/bash
# QR-QUIZ — Démarrage dev accessible depuis mobile (réseau local)
#
# Mode HTTP  : test complet sauf caméra QR scan
# Mode HTTPS : test complet avec caméra (installe mkcert si absent)
#
# Usage :
#   bash dev-mobile.sh        → HTTP (rapide)
#   bash dev-mobile.sh https  → HTTPS (caméra QR)

set -e

PORT=3000
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
MDNS_HOST="$(hostname -s).local"
MODE="${1:-http}"

if [ -z "$LOCAL_IP" ]; then
  echo "ERREUR : Impossible de détecter l'IP locale (Wi-Fi connecté ?)"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         QR-QUIZ — Dev Mobile             ║"
echo "╠══════════════════════════════════════════╣"
echo "║  IP locale  : $LOCAL_IP"
echo "║  mDNS       : $MDNS_HOST"
echo "║  Mode       : $MODE"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Mise à jour de NEXT_PUBLIC_BASE_URL dans .env ──────────────────
ENV_FILE=".env"

if [ "$MODE" = "https" ]; then
  BASE_URL="https://$MDNS_HOST:$PORT"
else
  BASE_URL="http://$MDNS_HOST:$PORT"
fi

# Remplace ou ajoute NEXT_PUBLIC_BASE_URL
if grep -q "^NEXT_PUBLIC_BASE_URL=" "$ENV_FILE"; then
  sed -i '' "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=$BASE_URL|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_BASE_URL=$BASE_URL" >> "$ENV_FILE"
fi

echo "✓ NEXT_PUBLIC_BASE_URL mis à jour → $BASE_URL"

# ── Mode HTTPS : génération du certificat avec mkcert ─────────────
if [ "$MODE" = "https" ]; then
  if ! command -v mkcert &>/dev/null; then
    echo ""
    echo "Installation de mkcert (certificats HTTPS locaux)..."
    if command -v brew &>/dev/null; then
      brew install mkcert nss
    else
      echo "ERREUR : Homebrew requis. Installez-le depuis https://brew.sh"
      exit 1
    fi
  fi

  echo ""
  echo "Génération du certificat local pour :"
  echo "  - localhost"
  echo "  - $MDNS_HOST"
  echo "  - $LOCAL_IP"
  echo ""

  mkdir -p certificates
  mkcert \
    -cert-file certificates/cert.pem \
    -key-file  certificates/key.pem \
    localhost "$MDNS_HOST" "$LOCAL_IP" 127.0.0.1 ::1

  mkcert -install

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  HTTPS prêt. Installez le CA sur votre mobile :             ║"
  echo "║                                                              ║"
  echo "║  iPhone / iPad :                                            ║"
  echo "║    1. Ouvrez Safari → http://$MDNS_HOST:$PORT/ca.crt       ║"
  echo "║    2. Réglages → Profil téléchargé → Installer             ║"
  echo "║    3. Réglages → Général → À propos → Réglages cert. → ✓   ║"
  echo "║                                                              ║"
  echo "║  Android :                                                  ║"
  echo "║    1. Téléchargez rootCA.pem depuis mkcert                 ║"
  echo "║    2. Réglages → Sécurité → Importer certificat            ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  # Copie du CA dans public/ pour accès facile depuis mobile
  MKCERT_ROOT=$(mkcert -CAROOT)
  cp "$MKCERT_ROOT/rootCA.pem" public/ca.crt
  echo "✓ CA disponible sur http://$MDNS_HOST:$PORT/ca.crt"
  echo ""

  echo "Démarrage Next.js HTTPS sur 0.0.0.0:$PORT..."
  echo ""
  echo "  → Accès mobile : https://$MDNS_HOST:$PORT"
  echo "  → Accès mobile : https://$LOCAL_IP:$PORT"
  echo ""

  # Next.js avec certificat mkcert
  NODE_TLS_REJECT_UNAUTHORIZED=0 \
  npx next dev \
    -H 0.0.0.0 \
    -p $PORT \
    --experimental-https \
    --experimental-https-key certificates/key.pem \
    --experimental-https-cert certificates/cert.pem

else
  # ── Mode HTTP ───────────────────────────────────────────────────
  echo ""
  echo "Démarrage Next.js HTTP sur 0.0.0.0:$PORT..."
  echo ""
  echo "  → Accès mobile : http://$MDNS_HOST:$PORT"
  echo "  → Accès mobile : http://$LOCAL_IP:$PORT"
  echo ""
  echo "  ⚠ Caméra QR indisponible en HTTP (normal pour le test local)"
  echo "    Utilisez : bash dev-mobile.sh https   pour activer la caméra"
  echo ""

  npx next dev -H 0.0.0.0 -p $PORT
fi
