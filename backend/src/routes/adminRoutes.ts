import { Router } from 'express';
import { adminLogin } from '../controllers/adminController.js';

const router: Router = Router();

router.post('/login', adminLogin);

export default router;