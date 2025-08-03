import express from 'express';
import {
  changeLanguage,
  testPermission,
  uploadFile,
  myPhoto,
  MultipleUploadFile,
  uploadProfileOptimize,
} from "../../../controllers/api/profileController";
import { auth } from '../../../middlewares/auth';
import upload, { uploadMemory } from '../../../middlewares/uploadFile';
import {
  getPost,
  getPostByPagination,
  getInfinitePostByPagination,
} from "../../../controllers/api/postController";

const router =express.Router();


router.post('/change-language', changeLanguage);
router.get('/test-permission', auth,testPermission);

router.patch('/profile/upload' ,auth ,upload.single('avatar'),uploadFile);
router.patch('/profile/upload/optimize', auth, upload.single('avatar'), uploadProfileOptimize);

router.patch('/profile/upload/multiple', auth, upload.array('avatar'), MultipleUploadFile);


router.get('/profile/my-photo',myPhoto) //just testing

router.get('/posts',auth,getPostByPagination);
router.get('/posts/infinite',auth,getInfinitePostByPagination);

router.get('/posts/:id', auth, getPost);


export  default router;