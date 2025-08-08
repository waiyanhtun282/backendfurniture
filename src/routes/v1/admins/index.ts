import express from 'express';
import { getAllUsers } from '../../../controllers/admin/userControllers';
import { setMaintenance } from '../../../controllers/admin/systemController';
import upload from '../../../middlewares/uploadFile';
import { createPost, deletePost, updatePost } from '../../../controllers/admin/postController';
import { createProduct ,deleteProduct,updateProduct} from '../../../controllers/admin/productController';

const router =express.Router();


router.get('/users', getAllUsers);
router.post('/maintenance',setMaintenance);

//CRUD for posts
router.post('/posts',upload.single('image'),createPost);
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", upload.single("image"), deletePost);

//CRUD for Products
router.post("/products",upload.array("images", 4 ),createProduct);
router.patch("/prodcuts", upload.array("images" , 4), updateProduct);
router.delete("/prodcuts", deleteProduct);


export  default router;