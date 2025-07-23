import express from 'express';
import { changeLanguage, testPermission } from '../../../controllers/api/profileController';

const router =express.Router();


router.post('/change-language', changeLanguage);
router.get('/test-permission', testPermission);

export  default router;