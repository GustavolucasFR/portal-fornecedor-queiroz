import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runSeeds } from './database/seed';
import { router } from './routes/apiRoutes';

dotenv.config();

// Garante que o banco suba criado e populado automaticamente
runSeeds(false);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`🚀 API do Portal do Fornecedor Grupo Queiroz rodando em http://localhost:${PORT}`);
});
