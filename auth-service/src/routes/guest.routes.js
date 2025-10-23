import { Router } from 'express';
import { guestLogin } from '../controllers/guest.controller.js';

const router = Router();

router.post('/login', guestLogin);

export default router;



