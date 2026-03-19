# Manuel de déploiement QR-QUIZ
### Guide complet pour débutants — de zéro à l'événement en direct

---

> **Ce manuel suppose que vous partez de zéro.** Pas besoin de connaître Docker, Linux ou le développement web. Suivez les étapes dans l'ordre.

---

## Ce dont vous aurez besoin

| Élément | Pourquoi | Coût estimé |
|---|---|---|
| Un VPS (serveur cloud) | Héberger l'application | ~4–6 €/mois (RackNerd, OVH, Hetzner) |
| Un nom de domaine | Accéder via une URL (ex: `monquiz.com`) | ~10–15 €/an (Namecheap, OVH) |
| Un ordinateur avec terminal | Pour se connecter au serveur | — |

> **Conseil** : Choisissez un VPS Ubuntu 22.04 LTS avec au minimum 1 CPU / 1 Go RAM / 20 Go SSD.

---

## Vue d'ensemble de l'architecture

```
Smartphone joueur
      │
      ▼
  Internet
      │
      ▼
Votre domaine (ex: quiz.monecole.be)
      │
      ▼
Nginx Proxy Manager  ←── gère le HTTPS automatiquement
      │
      ▼
Application QR-QUIZ (Docker)
      │
      ▼
Base de données PostgreSQL (Docker)
```

Tout tourne sur un seul serveur, dans des conteneurs Docker isolés.

---

## Étape 1 — Se connecter au serveur

Votre hébergeur vous a fourni une adresse IP, un utilisateur (`root`) et un mot de passe.

**Sur macOS / Linux**, ouvrez le Terminal et tapez :

```bash
ssh root@VOTRE_IP
```

Exemple : `ssh root@192.3.100.10`

Entrez le mot de passe quand il est demandé (les caractères ne s'affichent pas, c'est normal).

> **Sur Windows** : utilisez [PuTTY](https://putty.org/) ou le terminal Windows (PowerShell).

---

## Étape 2 — Installer Docker sur le serveur

Copiez-collez ces commandes une par une dans le terminal :

```bash
# Mettre à jour le système
apt-get update && apt-get upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com | sh

# Vérifier que Docker fonctionne
docker --version
```

Vous devriez voir quelque chose comme `Docker version 24.x.x`.

---

## Étape 3 — Installer Nginx Proxy Manager

Nginx Proxy Manager gère le HTTPS (cadenas vert) automatiquement, sans configuration technique.

```bash
# Créer le dossier
mkdir -p /opt/nginx-proxy-manager && cd /opt/nginx-proxy-manager

# Créer le fichier de configuration
cat > docker-compose.yml << 'EOF'
services:
  app:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    networks:
      - npm-network

volumes:
  npm-data:
  npm-letsencrypt:

networks:
  npm-network:
    driver: bridge
    name: nginx-proxy-manager_npm-network
EOF

# Démarrer Nginx Proxy Manager
docker compose up -d
```

Attendez 30 secondes, puis ouvrez dans votre navigateur :
```
http://VOTRE_IP:81
```

Connexion par défaut :
- Email : `admin@example.com`
- Mot de passe : `changeme`

> **Important** : Changez immédiatement le mot de passe après la première connexion.

---

## Étape 4 — Pointer votre domaine vers le serveur

Chez votre registrar (Namecheap, OVH, etc.), dans la gestion DNS de votre domaine, ajoutez :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | `VOTRE_IP` |
| A | `www` | `VOTRE_IP` |

> La propagation DNS prend entre 5 minutes et 2 heures.

---

## Étape 5 — Déployer l'application QR-QUIZ

### 5.1 — Télécharger l'image Docker

Sur le serveur, exécutez :

```bash
# Créer le dossier de l'application
mkdir -p /root/qrquiz && cd /root/qrquiz

# Télécharger l'image pré-construite
docker pull ghcr.io/pierrre2db/qrquiz:latest
```

### 5.2 — Créer le fichier de configuration

```bash
nano /root/qrquiz/.env
```

Copiez-collez ceci et **remplacez les valeurs** :

```env
POSTGRES_PASSWORD=MotDePasseDB_Solide2026
SESSION_SECRET=une_chaine_tres_longue_et_aleatoire_dau_moins_64_caracteres_ici
ADMIN_LOGIN=admin@votre-domaine.com
ADMIN_PASSWORD=MotDePasseAdmin2026
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
```

> **Règles importantes pour les mots de passe :**
> - Pas de `!` dans les mots de passe (cause une erreur technique)
> - `SESSION_SECRET` doit faire au moins 64 caractères
> - Notez ces informations dans un endroit sûr

Sauvegardez : `Ctrl+O` puis `Entrée`, quittez : `Ctrl+X`.

### 5.3 — Créer le fichier Docker Compose

```bash
nano /root/qrquiz/docker-compose.prod.yml
```

Copiez-collez exactement ceci :

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: qrquiz-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: qrquiz
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: qrquiz
    volumes:
      - qrquiz-db-data:/var/lib/postgresql/data
    networks:
      - qrquiz-net

  app:
    image: ghcr.io/pierrre2db/qrquiz:latest
    container_name: qrquiz-app
    restart: unless-stopped
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://qrquiz:${POSTGRES_PASSWORD}@postgres:5432/qrquiz
      SESSION_SECRET: ${SESSION_SECRET}
      ADMIN_LOGIN: ${ADMIN_LOGIN}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      NEXT_PUBLIC_BASE_URL: ${NEXT_PUBLIC_BASE_URL}
      NODE_ENV: production
      DATA_DIR: /app/data
    volumes:
      - qrquiz-data:/app/data
    networks:
      - qrquiz-net
      - npm_network

volumes:
  qrquiz-db-data:
  qrquiz-data:

networks:
  qrquiz-net:
    driver: bridge
  npm_network:
    external: true
    name: nginx-proxy-manager_npm-network
```

Sauvegardez : `Ctrl+O` puis `Entrée`, quittez : `Ctrl+X`.

### 5.4 — Démarrer l'application

```bash
cd /root/qrquiz
docker compose -f docker-compose.prod.yml up -d
```

Vérifiez que tout tourne :

```bash
docker ps
```

Vous devez voir deux lignes : `qrquiz-app` et `qrquiz-db` avec le statut `Up`.

---

## Étape 6 — Configurer le HTTPS dans Nginx Proxy Manager

1. Ouvrez `http://VOTRE_IP:81` dans votre navigateur
2. Connectez-vous avec votre compte admin NPM
3. Cliquez sur **Proxy Hosts** → **Add Proxy Host**
4. Remplissez :
   - **Domain Names** : `votre-domaine.com` et `www.votre-domaine.com`
   - **Scheme** : `http`
   - **Forward Hostname / IP** : `qrquiz-app`
   - **Forward Port** : `3000`
   - Cochez **Block Common Exploits**
5. Onglet **SSL** :
   - Sélectionnez **Request a new SSL Certificate**
   - Cochez **Force SSL** et **HTTP/2 Support**
   - Entrez votre email
   - Cochez **I Agree to the Let's Encrypt ToS**
6. Cliquez **Save**

Attendez 30 secondes. Votre site est maintenant accessible en HTTPS.

---

## Étape 7 — Première connexion à l'interface admin

Ouvrez `https://votre-domaine.com/admin` dans votre navigateur.

Connectez-vous avec :
- Login : la valeur de `ADMIN_LOGIN` dans votre `.env`
- Mot de passe : la valeur de `ADMIN_PASSWORD`

---

## Étape 8 — Configurer l'événement

### 8.1 — Créer les questions

Dans l'admin → **Questions** → **Nouvelle question** :

- **Label de la station** : nom affiché (ex: `Station 01 — Entrée`)
- **Code** : 3 chiffres uniques (ex: `101`) — c'est ce que les joueurs saisissent
- **Texte de la question**
- **4 options de réponse** (A, B, C, D)
- **Bonne réponse** : sélectionner la bonne option
- **Explication** (optionnel) : affichée après la réponse

### 8.2 — Générer les QR codes

Dans l'admin → **QR Codes** → **Générer tous les QR codes**.

Imprimez ensuite chaque QR code et placez-le à la station correspondante.

> Les QR codes encodent une URL stable. Si vous modifiez une question, le QR code reste valide.

### 8.3 — Configurer la page d'accueil projetée

Dans l'admin → **Page d'accueil** :
- Titre de l'événement
- Texte d'introduction
- URL du QR code d'inscription (pointe vers `https://votre-domaine.com/register`)

### 8.4 — Configurer la question subsidiaire

Dans l'admin → **Paramètres** : entrez la question subsidiaire (sert à départager en cas d'égalité).

---

## Le jour de l'événement

### Checklist avant d'ouvrir

- [ ] Ouvrir `https://votre-domaine.com/welcome` sur le projecteur (plein écran)
- [ ] Vérifier que les QR codes sont bien placés aux stations
- [ ] Tester avec un smartphone : scanner un QR code → s'inscrire → répondre
- [ ] Vérifier le classement en direct sur `/welcome`

### URLs utiles

| URL | Usage |
|---|---|
| `https://votre-domaine.com/register` | Inscription joueur |
| `https://votre-domaine.com/welcome` | Classement projeté (plein écran) |
| `https://votre-domaine.com/admin` | Interface d'administration |
| `https://votre-domaine.com/admin/results` | Résultats complets |
| `https://votre-domaine.com/guide` | Guide joueur |

### Exporter les résultats

Dans l'admin → **Résultats** → **Exporter CSV** ou **Exporter JSON**.

Le fichier contient pour chaque participant : prénom, nom, score, réponses par station, question subsidiaire.

### Réinitialiser pour une nouvelle session

Dans l'admin → bouton **Reset** (supprime tous les participants et réponses, conserve les questions).

---

## Commandes utiles sur le serveur

```bash
# Voir les logs de l'application (utile en cas de problème)
docker logs qrquiz-app --tail 50

# Redémarrer l'application
docker compose -f /root/qrquiz/docker-compose.prod.yml restart app

# Arrêter tout
docker compose -f /root/qrquiz/docker-compose.prod.yml down

# Mettre à jour vers la dernière version
docker pull ghcr.io/pierrre2db/qrquiz:latest
docker compose -f /root/qrquiz/docker-compose.prod.yml up -d
```

---

## Mettre à jour l'application

```bash
cd /root/qrquiz

# Télécharger la nouvelle version
docker pull ghcr.io/pierrre2db/qrquiz:latest

# Relancer (les données sont préservées)
docker compose -f docker-compose.prod.yml up -d
```

> Les données (participants, réponses, QR codes) sont stockées dans des volumes Docker séparés. Une mise à jour ne les efface pas.

---

## Résolution des problèmes courants

### Le site ne s'affiche pas

```bash
# Vérifier que les containers tournent
docker ps

# Voir les erreurs
docker logs qrquiz-app --tail 30
```

### Erreur "Bad escaped character in JSON" au login admin

Le mot de passe contient un `!`. Modifiez le `.env`, changez `ADMIN_PASSWORD`, puis :

```bash
docker compose -f /root/qrquiz/docker-compose.prod.yml up -d
```

### Le QR code ne fonctionne pas

Vérifiez que `NEXT_PUBLIC_BASE_URL` dans `.env` correspond exactement à votre domaine avec `https://`.

### La caméra ne s'ouvre pas sur mobile

Le scan QR nécessite HTTPS obligatoirement. Vérifiez que le certificat SSL est bien actif (cadenas vert dans le navigateur).

---

## Sauvegarder les données

Les données sont dans les volumes Docker. Pour les sauvegarder :

```bash
# Sauvegarder la base de données
docker exec qrquiz-db pg_dump -U qrquiz qrquiz > sauvegarde_$(date +%Y%m%d).sql

# Copier la sauvegarde sur votre machine locale
scp root@VOTRE_IP:~/sauvegarde_*.sql ./
```

---

## Informations techniques (pour référence)

| Élément | Valeur |
|---|---|
| Image Docker | `ghcr.io/pierrre2db/qrquiz:latest` |
| Version CEFOR | `ghcr.io/pierrre2db/qrquiz:v1.0.0-cefor` |
| Code source | [github.com/pierrre2db/qrquiz](https://github.com/pierrre2db/qrquiz) |
| Port application | `3000` |
| Base de données | PostgreSQL 15 |
| Node.js | 20 LTS |
