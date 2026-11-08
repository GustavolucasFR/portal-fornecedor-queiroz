import { Router } from 'express';
import { login } from '../controllers/authController';
import { listarTitulosFornecedor } from '../controllers/titulosController';
import { authMiddleware } from '../middlewares/authMiddleware';

export const router = Router();

router.post('/auth/login', login);
router.get('/titulos', authMiddleware, listarTitulosFornecedor);
router.get('/health', (_req, res) => res.json({ status: 'ok' }));
