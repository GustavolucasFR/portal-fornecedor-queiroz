#!/usr/bin/env bash
set -e

echo "Inicializando repositório Git com commits semânticos incrementais..."
git init
git branch -M main

git add .gitignore README.md
git commit -m "docs: adiciona README detalhado e configuracao inicial do projeto"

git add backend/package.json backend/tsconfig.json backend/.env.example backend/data/
git commit -m "chore(backend): configura estrutura TypeScript e adiciona arquivos CSV do ERP"

git add backend/src/database/ backend/database.sqlite
git commit -m "feat(database): implementa migrations SQL relacionais e seed dos CSVs"

git add backend/src/middlewares/ backend/src/controllers/ backend/src/routes/ backend/src/server.ts
git commit -m "feat(api): implementa autenticacao JWT e endpoint seguro de titulos em aberto"

git add frontend/
git commit -m "feat(frontend): desenvolve telas responsivas de login e pendencias em Next.js"

echo "✅ Historico de commits criado com sucesso! Pronto para git remote add origin <URL> && git push -u origin main"
