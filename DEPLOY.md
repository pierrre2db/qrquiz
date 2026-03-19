# Guide de déploiement — QR-QUIZ

> Les credentials réels sont dans `.env.prod` (fichier local, jamais versionné).

## Infra cible

| Élément | Valeur |
|---|---|
| VPS | Ubuntu 22.04 — IP dans `.env.prod` |
| User SSH | `root` |
| Répertoire | `/root/qrquiz/` |
| Domaine | `quiz.dedobbeleer.online` (SSL via Nginx Proxy Manager) |
| Compose file | `docker-compose.prod.yml` |
| Containers | `qrquiz-app` (port 3000) · `qrquiz-db` (postgres:15-alpine) |

---

## Prérequis sur la machine locale

- `sshpass` installé (`brew install sshpass` sur macOS)
- `rsync` disponible
- Travailler depuis la racine du projet

---

## Commande de déploiement complète

```bash
# 1. Rsync (ne JAMAIS omettre les --exclude)
sshpass -p 'VPS_PASSWORD' rsync -az \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.env' \
  --exclude '.env.prod' \
  --exclude 'data' \
  -e "ssh -o StrictHostKeyChecking=no" \
  . root@VPS_IP:/root/qrquiz/

# 2. Build + restart sur le VPS
sshpass -p 'VPS_PASSWORD' ssh -o StrictHostKeyChecking=no root@VPS_IP \
  'cd /root/qrquiz && docker compose -f docker-compose.prod.yml build app && docker compose -f docker-compose.prod.yml up -d'
```

> Remplacer `VPS_PASSWORD` et `VPS_IP` par les valeurs de `.env.prod`.

---

## Pièges critiques

### 1. Ne jamais écraser le `.env` de production
Le `.env` sur le VPS contient les secrets (POSTGRES_PASSWORD, SESSION_SECRET).
Si rsync l'écrase, la base devient inaccessible — il faut recréer le fichier manuellement + `ALTER USER` PostgreSQL.

**Toujours inclure `--exclude .env` dans rsync.**

### 2. Ne jamais écraser `data/`
Le dossier `data/` contient les QR codes générés (`/app/data/qrcodes/*.png`).
Si écrasé, tous les QR codes doivent être régénérés depuis l'interface admin.

**Toujours inclure `--exclude data` dans rsync.**

### 3. Mot de passe admin sans `!`
Le caractère `!` dans un mot de passe cause un `Bad escaped character in JSON` au login.
Utiliser uniquement : lettres, chiffres, `_`.

### 4. `export const dynamic = 'force-dynamic'` sur toutes les routes Prisma
Next.js tente de prerendre les routes au build Docker → crash si une route accède à Prisma sans cette directive.
**Toute route API qui fait un appel Prisma doit avoir cette ligne en tête de fichier.**

---

## Déploiement via image Docker (ghcr.io)

Si on veut aller vite sans recompiler :

```bash
# Sur le VPS
docker pull ghcr.io/pierrre2db/qrquiz:latest

# Puis relancer avec docker compose
docker compose -f docker-compose.prod.yml up -d
```

---

## Vérification post-déploiement

```bash
# Logs de l'app
sshpass -p 'VPS_PASSWORD' ssh -o StrictHostKeyChecking=no root@VPS_IP \
  'docker logs qrquiz-app --tail 30'

# État des containers
sshpass -p 'VPS_PASSWORD' ssh -o StrictHostKeyChecking=no root@VPS_IP \
  'docker compose -f /root/qrquiz/docker-compose.prod.yml ps'
```

Puis ouvrir `https://quiz.dedobbeleer.online` pour confirmer.

---

## Reset des données (simulation / test)

Depuis l'interface : `https://quiz.dedobbeleer.online/admin` → bouton **Reset**.

---

## Scripts de simulation

```bash
# 5 joueurs (test rapide ~3 min)
node scripts/live-demo.mjs https://quiz.dedobbeleer.online 5

# 25 joueurs (démo live ~7 min)
node scripts/live-demo.mjs https://quiz.dedobbeleer.online 25

# Test fenêtre glissante (2 vagues — ~7 min avec fenêtre test 2 min)
node scripts/window-test.mjs https://quiz.dedobbeleer.online
```

> **Attention** : `window-test.mjs` utilise une fenêtre de 2 minutes pour le test.
> Après le test, remettre `WINDOW_MS = 2 * 60 * 60 * 1000` dans `src/app/api/public/scoreboard/route.ts` et redéployer.
