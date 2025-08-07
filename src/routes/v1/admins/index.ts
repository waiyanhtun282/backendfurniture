import express from 'express';
import { getAllUsers } from '../../../controllers/admin/userControllers';
import { setMaintenance } from '../../../controllers/admin/systemController';

import upload from '../../../middlewares/uploadFile';
import { createPost, deletePost, updatePost } from '../../../controllers/admin/postcontroller';
import { createProduct } from '../../../controllers/admin/productController';

const router =express.Router();


router.get('/users', getAllUsers);
router.post('/maintenance',setMaintenance);

//CRUD for posts
router.post('/posts',upload.single('image'),createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", upload.single("image"), deletePost);

//CRUD for Products
router.post("/products",upload.array("image", 4 ),createProduct);
// router.patch("/prodcuts", upload.array("images"), updateProucts);
// router.delete("/prodcuts", deleteProducts);


export  default router;