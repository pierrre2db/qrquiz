# QR-QUIZ

Application mobile de concours QCM par QR Code, conçue pour des événements scolaires ou des parcours physiques.

Les participants scannent des QR codes affichés en salle, répondent à des questions à choix multiples sur leur smartphone, et s'affrontent en temps réel sur un classement projeté.

**Live** : [https://quiz.dedobbeleer.online](https://quiz.dedobbeleer.online)

---

## Fonctionnalités

- Inscription participant (prénom, nom, email, téléphone)
- Dashboard personnel avec progression par station
- Scan QR code ou saisie manuelle du code station (3 chiffres)
- Questions QCM (4 options, explication post-réponse, anti double-submit)
- Question subsidiaire en fin de parcours
- Classement en direct `/welcome` — fenêtre glissante 2h, top 10, podium animé
- Ticker des derniers inscrits (mise à jour toutes les 3s)
- Interface admin complète : questions, QR codes, participants, résultats, reset
- Export CSV et JSON avec toutes les réponses par station
- Redirection automatique vers `/complete` à la dernière station

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend / Backend | Next.js 14 (App Router) · TypeScript |
| Styles | Tailwind CSS |
| Base de données | PostgreSQL 15 · Prisma ORM |
| Runtime | Node.js 20 |
| Déploiement | Docker Compose (multi-stage build) |
| Reverse proxy | Nginx Proxy Manager |
| SSL | Let's Encrypt (auto-renouvellement) |

---

## Structure des pages

```
/register          → Inscription
/dashboard         → Vue d'ensemble des stations
/station/[id]      → Question QCM d'une station
/station/code/[x]  → Résolution du code 3 chiffres → UUID
/complete          → Fin du parcours + question subsidiaire
/welcome           → Classement projeté (plein écran)
/guide             → Guide joueur
/admin             → Interface d'administration
```

---

## Lancer en développement local

### Prérequis

- Node.js 20+
- PostgreSQL 15 (ou Docker)
- npm

### Installation

```bash
# 1. Cloner le repo
git clone https://github.com/pierrre2db/qrquiz.git
cd qrquiz

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Initialiser la base de données
npx prisma migrate deploy
npx prisma db seed

# 5. Démarrer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql://qrquiz:MOT_DE_PASSE@localhost:5432/qrquiz
SESSION_SECRET=chaine_aleatoire_64_chars_minimum
ADMIN_LOGIN=admin@votre-domaine.com
ADMIN_PASSWORD=MotDePasseAdmin     # pas de ! dans le mot de passe
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
DATA_DIR=./data
```

> Le mot de passe admin **ne doit pas contenir `!`** — cause une erreur JSON au login.

---

## Déploiement via Docker (production)

### Option 1 — Image pré-construite (recommandé pour aller vite)

```bash
# Sur le VPS, créer le .env puis lancer :
docker pull ghcr.io/pierrre2db/qrquiz:latest
docker compose -f docker-compose.prod.yml up -d
```

### Option 2 — Build depuis les sources

```bash
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d
```

### Fichier `.env` sur le VPS

Créer `/root/qrquiz/.env` :

```env
POSTGRES_PASSWORD=MOT_DE_PASSE_DB
SESSION_SECRET=chaine_aleatoire_64_chars_minimum
ADMIN_LOGIN=admin@votre-domaine.com
ADMIN_PASSWORD=MotDePasseAdmin
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

> Voir `DEPLOY.md` pour la procédure complète de déploiement via rsync.

---

## Déploiement complet sur un nouveau VPS

> Procédure détaillée dans [`DEPLOY.md`](./DEPLOY.md).

Résumé rapide :

```bash
# Rsync depuis la machine locale
sshpass -p 'VPS_PASSWORD' rsync -az \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude '.env' --exclude '.env.prod' --exclude 'data' \
  -e "ssh -o StrictHostKeyChecking=no" \
  . root@VPS_IP:/root/qrquiz/

# Build + démarrage
sshpass -p 'VPS_PASSWORD' ssh root@VPS_IP \
  'cd /root/qrquiz && docker compose -f docker-compose.prod.yml build app && docker compose -f docker-compose.prod.yml up -d'
```

---

## Scripts de simulation

Utiles pour tester le classement en live avant un événement.

```bash
# Test rapide — 5 joueurs (~3 min)
node scripts/live-demo.mjs https://quiz.dedobbeleer.online 5

# Démo complète — 25 joueurs (~7 min)
node scripts/live-demo.mjs https://quiz.dedobbeleer.online 25

# Test fenêtre glissante — 2 vagues séparées
node scripts/window-test.mjs https://quiz.dedobbeleer.online
```

Les scripts se connectent en admin, réinitialisent la base, puis simulent des joueurs avec des taux de bonnes réponses variés.

---

## Points d'architecture importants

- **`export const dynamic = 'force-dynamic'`** — obligatoire sur toutes les routes Prisma, sinon Next.js tente de les prerendre au build Docker et échoue.
- **Route groups** — `(public)` avec `mobile-container` (max 430px) pour les pages joueurs, `(fullscreen)` sans contrainte de largeur pour `/welcome`.
- **QR codes** — encodent `/station/code/{stationCode}` (stable même si la question est recréée).
- **Classement** — fenêtre glissante 2h avec fallback sur tout le classement si aucun joueur dans la fenêtre.
- **`.env` sur VPS** — ne jamais écraser avec rsync (`--exclude .env`).

---

## Versions

| Tag | Description |
|---|---|
| `v1.0.0-cefor` | Version déployée pour l'événement CEFOR (mars 2026) |
| `latest` | Dernière version stable |
