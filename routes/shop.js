const isAuth = require('../middleware/isAuth')

const express = require('express');
 
const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/product', shopController.getProducts);

router.get('/product/:productId', shopController.findProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart',shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.post('/create-order', isAuth, shopController.postOrder);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/address', isAuth, shopController.getAddress);

router.post('/address',isAuth, shopController.postAddress);

router.get('/add-form',isAuth, shopController.getAddForm);

router.get('/delete-add/:addressId', isAuth, shopController.deleteAdd)

router.get('/checkout',shopController.getCheckout );

router.get('/orders/:orderId',isAuth, shopController.getInvoice);

module.exports = router;
