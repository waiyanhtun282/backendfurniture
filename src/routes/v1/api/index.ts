import express from 'express';
import { changeLanguage, testPermission, uploadFile } from '../../../controllers/api/profileController';
import { auth } from '../../../middlewares/auth';
import upload from '../../../middlewares/uploadFile';

const router =express.Router();


router.post('/change-language', changeLanguage);
router.get('/test-permission', auth,testPermission);

router.patch('/profile/upload' ,auth ,upload.single('avatar'),uploadFile)

export  default router;