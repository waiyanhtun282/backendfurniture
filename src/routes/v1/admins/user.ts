import express from 'express';
import { getAllUsers } from '../../../controllers/admin/userControllers';

const router =express.Router();


router.get('/users', getAllUsers);
export  default router;