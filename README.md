# Portal do Fornecedor — Grupo Queiroz

Portal web full-stack desenvolvido para que os fornecedores do **Grupo Queiroz** consultem com autonomia, clareza e segurança suas pendências financeiras em aberto, distinguindo títulos vencidos e a vencer.

---

## 🛠️ Stack Tecnológica

- **Banco de Dados Relacional:** SQLite (`better-sqlite3`) com integridade referencial (`FOREIGN KEY`) e consultas em SQL puro relacionando `titulos` e `especies`. *(O arquivo `database.sqlite` já acompanha o projeto populado e pronto para uso, além de possuir comando de migration/seed automatizado).*
- **Back-end (API REST):** Node.js + TypeScript + Express + Autenticação JWT + Hash criptográfico PBKDF2-SHA256 nativo (`crypto`).
- **Front-end:** Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + Lucide Icons.

---

## 🚀 Como instalar e rodar o projeto do zero

### Pré-requisitos
- **Node.js** 18+ e **npm** instalados.

### 1. Configurar e iniciar o Back-end (API)
Abra um terminal na raiz do projeto e execute:

```bash
cd backend
npm install
npm run migrate   # Executa as migrations SQL e popula o banco com os CSVs
npm run dev       # Inicia a API REST em http://localhost:3001
```
> **Nota:** O servidor também verifica e executa automaticamente as migrations/seeds ao iniciar caso o banco ainda não esteja populado.

### 2. Configurar e iniciar o Front-end (Next.js)
Abra um **segundo terminal** na raiz do projeto e execute:

```bash
cd frontend
npm install
npm run dev       # Inicia o portal em http://localhost:3000
```

### 3. Acessar o Portal
Abra o navegador em `http://localhost:3000`:
- **Usuário:** `4827`
- **Senha:** `queiroz@2026`

---

## 🗄️ Como rodar as migrations que criam e populam o banco

As migrations e seeds ficam em `backend/src/database/`:
- `migrations.ts`: Cria as tabelas relacionais `fornecedores`, `especies` e `titulos` (com chaves estrangeiras ligando `titulos.codespecie -> especies.codespecie` e `titulos.seqpessoa -> fornecedores.seqpessoa`).
- `seed.ts`: Lê os arquivos `backend/data/consulta2_especies.csv` e `backend/data/consulta1_titulos.csv`, converte valores monetários brasileiros (`1.234,56` -> `float`), padroniza datas ISO (`YYYY-MM-DD`) para ordenação/comparação SQL precisa e cria o usuário `4827` com a senha padrão `queiroz@2026`.

Para recriar e repopular o banco manualmente a qualquer momento:
```bash
cd backend
npm run migrate
```

---

## 🧠 Principais Decisões Técnicas e Regras de Negócio

1. **Regra de Negócio (`obrigdireito = 'D'` vs `'O'`):**
   - O contexto do problema destaca que cada fornecedor precisa ver **quanto deve ao Queiroz** e o que está vencido ou para vencer.
   - Na tabela `consulta2_especies.csv`, a coluna `obrigdireito` define:
     - **`D` (Direito do Queiroz):** O fornecedor deve ao Grupo Queiroz (ex.: *Devolução a Receber Fornec - 211*, *Verba Sell-Out - 221*, *Verba Quebra/Avaria - 221*). Para o fornecedor `4827`, existem **34 títulos do tipo `D`**, somando **R$ 7.767,83**.
     - **`O` (Obrigação do Queiroz):** O Grupo Queiroz deve ao fornecedor (ex.: *Duplicata Fornecedor - 201*, *Duplicata c/ Devolução - 201*, *Adiantamento Recebido - 231*), somando **R$ 498.411,01** em 58 títulos.
   - **Decisão de UX/Negócio:** A tela de pendências abre focada nos **Débitos do Fornecedor (`D` — R$ 7.767,83)** nos cards principais do topo (Total Devido ao Queiroz, Total Vencido e Total a Vencer), respondendo exatamente à dor do setor financeiro. Além disso, disponibilizamos abas rápidas na listagem caso o fornecedor deseje conferir também suas duplicatas a receber (`O`) ou todos os títulos.

2. **Cálculo de Valor em Aberto e Status de Vencimento no SQL:**
   - O valor em aberto de cada título é calculado na consulta SQL como `ROUND(t.vlrnominal - t.vlrpago, 2)`, filtrando apenas títulos com saldo em aberto maior que zero.
   - A comparação entre vencido (`VENCIDO`) e a vencer (`A_VENCER`) é feita diretamente no SQL comparando a data de vencimento do título com a data atual (`CURRENT_DATE`), considerando vencidos os títulos com data estritamente anterior a hoje.

3. **Segurança e Isolamento dos Dados por Fornecedor:**
   - Autenticação via **JWT (JSON Web Token)** assinado no back-end.
   - O endpoint `GET /api/titulos` é protegido pelo `authMiddleware` e **não aceita `seqpessoa` via query/body/params**. Ele extrai o código do fornecedor exclusivamente do payload decodificado do JWT (`req.user.seqpessoa`), garantindo que um fornecedor jamais acesse títulos de terceiros.

4. **Responsividade (Desktop & Mobile):**
   - Em telas desktop (`md+`), os títulos são exibidos em tabela financeira completa.
   - Em smartphones, a listagem converte-se automaticamente em cards verticais de fácil leitura para um fornecedor leigo.

---

## 🔮 O que eu faria a mais se tivesse mais tempo

- **Emissão de 2ª Via de Boleto / QR Code PIX:** Permitir que o fornecedor liquide imediatamente seus títulos vencidos (`D`) gerando um código PIX Copia e Cola ou boleto direto no portal.
- **Exportação de Relatórios (PDF e Excel/CSV):** Botão para o fornecedor baixar o extrato filtrado para sua contabilidade.
- **Testes Automatizados (E2E e Unitários):** Testes de integração nos endpoints com Vitest/Supertest e testes E2E do fluxo de login/logout com Playwright.
- **Dockerização Completa (`docker-compose.yml`):** Subir API, Front-end e banco PostgreSQL em containers isolados com um único comando.
