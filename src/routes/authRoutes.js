import { signup, signin, signout } from '#controllers/auth.controller.js';
import express from 'express';

const router = express.Router();

router.post('/register',signup);
router.post('/login',signin);
router.post('/logout',signout);

export default router;
