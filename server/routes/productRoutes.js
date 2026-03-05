const express = require('express');
const router = express.Router();
const {
    getProducts, getProduct, createProduct, updateProduct, deleteProduct,
    getLowStock, getExpiringBatches, getProductBatches,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// Alert routes must come before /:id routes
router.get('/alerts/low-stock', protect, getLowStock);
router.get('/alerts/expiring', protect, getExpiringBatches);

router.route('/')
    .get(protect, getProducts)
    .post(protect, createProduct);

router.route('/:id')
    .get(protect, getProduct)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);

router.get('/:id/batches', protect, getProductBatches);

module.exports = router;
