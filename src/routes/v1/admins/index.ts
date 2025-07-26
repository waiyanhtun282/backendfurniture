import express from 'express';
import { getAllUsers } from '../../../controllers/admin/userControllers';
import { setMaintenance } from '../../../controllers/admin/systemController';

const router =express.Router();


router.get('/users', getAllUsers);
router.post('/mainteance',setMaintenance)
export  default router;