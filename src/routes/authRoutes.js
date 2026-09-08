import { signup } from '#controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/register',signup);

export default router;
