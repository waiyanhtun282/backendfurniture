import express from 'express';
import { getAllUsers } from '../../../controllers/admin/userControllers';
import { setMaintenance } from '../../../controllers/admin/systemController';
import { createPost, deletePost, updatePost } from '../../../controllers/admin/postcontroller';
import upload from '../../../middlewares/uploadFile';

const router =express.Router();


router.get('/users', getAllUsers);
router.post('/maintenance',setMaintenance);

//CRUD for posts
router.post('/posts',upload.single('image'),createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", upload.single("image"), deletePost);


export  default router;