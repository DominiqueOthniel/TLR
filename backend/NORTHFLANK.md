# Déploiement Northflank - Backend NestJS

Ce backend est prêt pour Northflank via le `Dockerfile` du dossier `backend`.

## Service à créer

Dans Northflank, créer un **Deployment Service**.

- **Repository** : ce repo Git
- **Build type** : Dockerfile
- **Dockerfile path** : `backend/Dockerfile`
- **Build context** : `backend`
- **Internal port / Public port** : `8080`
- **Health check path** : `/api/health`

Le conteneur écoute sur `0.0.0.0` et utilise `PORT=8080` par défaut.

## Variables d'environnement Northflank

Ajouter ces variables dans le service :

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
DB_SYNCHRONIZE=true
FRONTEND_URL=https://ton-site.netlify.app
```

Après le premier démarrage réussi et la création des tables, repasser :

```env
DB_SYNCHRONIZE=false
```

`DATABASE_URL` doit être l'URI Supabase en mode pooler/transaction si disponible.

## URL à mettre dans Netlify

Quand Northflank donne l'URL publique du backend, configurer Netlify avec :

```env
VITE_API_URL=https://ton-backend.northflank.app/api
```

Le backend autorise déjà les domaines `*.netlify.app` et `*.northflank.app` côté CORS.
