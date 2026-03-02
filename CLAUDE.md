# Quadros Store - Project Guidelines

## Versionamento

- A versao atual fica no footer em `quadros-frontend/src/components/layout/Footer.tsx`
- **Todo deploy deve bumpar a versao** no footer antes de fazer push
- Formato: `v0.0.X` (incrementar o patch a cada deploy)
- Versao atual: **v0.0.2**

## Infraestrutura

- **Frontend**: Next.js no Netlify (quadros-loja, site ID: c53a26ee-0a54-479f-87ed-154d3261dce5)
  - URL: https://quadros-loja.netlify.app
  - Deploy automatico a cada push no master
- **Backend**: Medusa v2 na VPS (165.227.197.59)
  - SSH: `root@165.227.197.59`
  - Path: `/opt/medusa-quadros/quadros-store/`
  - PM2 process: `quadros-api` (id 4)
  - Node: `source /root/.nvm/nvm.sh && nvm use 20`
  - Admin: `quadros@admin.com` / `quadros2026`

## Deploy

### Backend (VPS)
```bash
ssh root@165.227.197.59 "source /root/.nvm/nvm.sh && nvm use 20 && cd /opt/medusa-quadros && git pull origin master && cd quadros-store && npm run build && pm2 restart quadros-api"
```

### Frontend (Netlify)
Deploy automatico via push no master. Verificar status:
```bash
curl -s -H "Authorization: Bearer nfc_U3WdLhE22T9vwyXyn8LyaZeAdABgVQUe87d2" \
  "https://api.netlify.com/api/v1/sites/c53a26ee-0a54-479f-87ed-154d3261dce5/deploys?per_page=1"
```

## Mercado Pago

- Credenciais salvas em Obsidian: `Projetos/Quadros Store - Credenciais Mercado Pago.md`
- Usar credenciais de **producao** (`APP_USR-`) mesmo para sandbox
- Credenciais `TEST-` NAO funcionam para cartao de credito
