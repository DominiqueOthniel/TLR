# DÃ©ploiement du backend (Railway ou Render)

## Railway vs Render â€” lequel choisir ?

| CritÃ¨re | **Render** | **Railway** |
|--------|------------|-------------|
| **Free tier** | 750 h/mois (instance qui sâ€™endort aprÃ¨s inactivitÃ©) | Plus de free tier ; ~5 $ de crÃ©dit offerts, puis facturation Ã  lâ€™usage |
| **CoÃ»t typique** | ~7 $/mois (Starter) une fois payant | ~2â€“5 $/mois pour un petit backend Node |
| **Sleep mode** | Oui sur free â†’ premier appel peut prendre 30â€“60 s | Non, lâ€™app reste chaude |
| **Build / DX** | Bon, blueprint `render.yaml` | TrÃ¨s bon, dÃ©ploiement trÃ¨s rapide |
| **StabilitÃ© / prod** | TrÃ¨s bon, adaptÃ© Ã  la prod | Bon, souvent utilisÃ© en prod aussi |
| **PostgreSQL** | Externe (ex. Supabase gratuit) recommandÃ© | Idem, ou PostgreSQL Railway (~3 $/mois) |

**En pratique :**

- **Render** : adaptÃ© si tu veux un free tier rÃ©el (750 h) et une config claire (fichier `render.yaml` Ã  la racine). Lâ€™endormissement peut Ãªtre gÃªnant pour une API toujours rÃ©active.
- **Railway** : adaptÃ© si tu acceptes quelques dollars par mois, que tu veux un dÃ©ploiement trÃ¨s simple et une API toujours rÃ©veillÃ©e.

Les deux conviennent pour ce backend NestJS ; le choix dÃ©pend surtout du budget et de la prÃ©fÃ©rence free tier vs pas de sleep.

---

## PrÃ©requis communs

- **Base de donnÃ©es** : PostgreSQL (ex. [Supabase](https://supabase.com) gratuit, ou PostgreSQL managÃ© Render/Railway).
- **Variables dâ€™environnement** :
  - `DATABASE_URL` : chaÃ®ne de connexion PostgreSQL (ex. Supabase : *Connection string* â†’ URI, mode Transaction).
  - `FRONTEND_URL` : URL du front (ex. `https://ton-app.netlify.app`) pour CORS.
  - `PORT` : fourni automatiquement par Render et Railway, pas besoin de le dÃ©finir.
  - `DB_SYNCHRONIZE` : `true` au premier dÃ©ploiement pour crÃ©er les tables, puis `false` en prod.

---

## Ã‰tapes pour dÃ©ployer le backend sur Render

### Avant de commencer

- Un compte [Render](https://render.com) (connexion GitHub recommandÃ©e).
- Une base PostgreSQL : ex. [Supabase](https://supabase.com) (gratuit) â†’ *Project Settings â†’ Database â†’ Connection string â†’ URI* (mode **Transaction**). Format :  
  `postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

---

### Option A : DÃ©ploiement avec Blueprint (recommandÃ©)

1. Sur Render : **New +** â†’ **Blueprint**.
2. Connecte ton **repo GitHub** (autoriser Render si besoin).
3. Render lit le `render.yaml` Ã  la racine du repo et crÃ©e le service **goofe-api** avec `rootDir: backend`.
4. Clique sur **Apply**.
5. Dans le **Dashboard** du service **goofe-api** â†’ onglet **Environment** : ajoute (Add Environment Variable) :
   - `DATABASE_URL` = ta chaÃ®ne PostgreSQL (ex. Supabase).
   - `FRONTEND_URL` = URL de ton front (ex. `https://ton-app.netlify.app`). Si pas encore de front en prod, mets `http://localhost:5173`.
   - `DB_SYNCHRONIZE` = `true` pour le **premier** dÃ©ploiement (crÃ©ation des tables). AprÃ¨s succÃ¨s, repasse Ã  `false`.
6. Sauvegarde ; Render lance le build puis le deploy.
7. Une fois terminÃ©, lâ€™API est Ã  lâ€™URL indiquÃ©e (ex. `https://goofe-api.onrender.com`). VÃ©rifie : **GET** `https://ton-url.onrender.com/api/health` â†’ `{"status":"ok"}`.

---

### Option B : DÃ©ploiement manuel (Web Service)

1. Sur Render : **New +** â†’ **Web Service**.
2. Connecte ton **repo GitHub** et sÃ©lectionne le dÃ©pÃ´t.
3. Configure :
   - **Name** : `goofe-api` (ou autre).
   - **Region** : ex. Frankfurt.
   - **Root Directory** : `backend` (obligatoire).
   - **Runtime** : Node.
   - **Build Command** : `NPM_CONFIG_PRODUCTION=false npm install && npm run build` (nécessaire pour installer les devDependencies dont @nestjs/cli)
   - **Start Command** : `npm run start:prod`
4. **Plan** : Free (ou Starter pour Ã©viter le sleep).
5. **Advanced** â†’ **Health Check Path** : `/api/health`.
6. **Environment Variables** :
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (ta chaÃ®ne PostgreSQL)
   - `FRONTEND_URL` = (URL du front ou `http://localhost:5173`)
   - `DB_SYNCHRONIZE` = `true` au premier dÃ©ploiement, puis `false` ensuite
7. **Create Web Service**. VÃ©rifie : **GET** `https://[ton-service].onrender.com/api/health` â†’ `{"status":"ok"}`.

---

### AprÃ¨s le premier dÃ©ploiement

- Mets `DB_SYNCHRONIZE` Ã  `false` en **Environment** (Ã©viter que TypeORM modifie le schÃ©ma en prod).
- Configure le front pour appeler lâ€™URL Render (ex. `VITE_API_URL=https://goofe-api.onrender.com/api` si Vite).
- Sur le free tier, le service peut sâ€™endormir aprÃ¨s ~15 min ; le premier appel peut prendre 30â€“60 s.

---

3. **Root Directory** : `backend` (ou laisser vide si tu utilises le `render.yaml` Ã  la **racine** du repo, qui dÃ©finit dÃ©jÃ  `rootDir: backend`).
4. **Build** : `NPM_CONFIG_PRODUCTION=false npm install && npm run build`  
1. CrÃ©er un compte sur [railway.app](https://railway.app).
2. **New Project â†’ Deploy from GitHub repo**, choisir le repo.
3. Dans les paramÃ¨tres du service :
   - **Root Directory** : `backend`
   - La **Start Command** peut rester celle par dÃ©faut si un `Procfile` ou `railway.json` est prÃ©sent dans `backend` (dÃ©jÃ  le cas : `npm run start:prod`).
4. **Variables** (onglet Variables) :
   - `DATABASE_URL` = (ta chaÃ®ne PostgreSQL)
   - `FRONTEND_URL` = URL du front
   - `DB_SYNCHRONIZE` = `true` au premier dÃ©ploiement, puis `false`
5. DÃ©ployer. Railway fournit une URL publique (ex. `https://xxx.up.railway.app`). Health check : `GET /api/health`.

Le `Procfile` et `railway.json` dans `backend/` sont dÃ©jÃ  configurÃ©s pour lancer `npm run start:prod`.

---

## Dépannage (Render / Railway)

- **`nest: not found` au build** : le script utilise désormais `npx nest build`. Vérifie que **Root Directory** = `backend`.
- **`Unable to connect to the database` / ETIMEDOUT** : utilise l’URL **Supabase en mode Transaction (pooler)** : *Project Settings → Database → Connection string → URI* avec **Transaction** (port **6543**, hôte `*.pooler.supabase.com`). Pas l’URL directe (port 5432).
- **No open ports detected** : l’app n’écoute qu’après connexion à la DB. Corriger `DATABASE_URL` résout le problème.

---

## CORS

Le backend autorise dÃ©jÃ  :

- `FRONTEND_URL` (variable dâ€™environnement)
- `*.netlify.app`, `*.vercel.app`, `*.onrender.com`, `*.railway.app`

En prod, dÃ©finir `FRONTEND_URL` avec lâ€™URL exacte du front (ex. Netlify/Vercel) pour Ã©viter les refus CORS.
