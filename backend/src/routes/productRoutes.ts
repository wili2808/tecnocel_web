import { Router } from 'express';
import ProductController from '../controllers/ProductController.js';

const router = Router();

router.get('/products', ProductController.getProducts);

export default router;
