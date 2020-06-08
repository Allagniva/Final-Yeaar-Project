const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;


// product-list
exports.getProducts= (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find().countDocuments().then(nProducts => {
    totalItems = nProducts;
    return Product.find()
    .skip((page - 1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then((products) => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/product',
      totalItems: totalItems,
      hasNextPage: (ITEMS_PER_PAGE*page) < totalItems,
      nextPage: page + 1,
      hasPrevPage: page > 1,
      prevPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      currentPage: page
    });
  }).catch(err =>{
    console.log(err);
  });
};
//Get Products by Id
exports.findProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then((proDuct) => {
    res.render('shop/product-details',{
      product: proDuct,
      pageTitle: proDuct.title,
      path: '/product',
    })
  }).catch(err => {
    console.log(err); 
  });
};

// Index
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.find().countDocuments().then(nProducts => {
    totalItems = nProducts;
    return Product.find()
    .skip((page - 1)*ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
  })
  .then((products) => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Welcome to Home',
      path: '/',
      totalItems: totalItems,
      hasNextPage: (ITEMS_PER_PAGE*page) < totalItems,
      nextPage: page + 1,
      hasPrevPage: page > 1,
      prevPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      currentPage: page
    });
  }).catch(err => {
    console.log(err);
  });
};
// Cart
exports.getCart = (req, res, next) => {
  req.user.populate('cart.items.productId').execPopulate().then(user => {
    const products = user.cart.items;
    let total = 0;
    for(prod of products){
      total= total + prod.productId.price*prod.quantity;
    }
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
      totalPrice: total
    });
  })
  .catch(err => {console.log(err);});
};
// Post cart

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then((product) => {
    return req.user.addToCart(product);
  }).then(() => {
    res.redirect('/cart');
  }).catch(err => {
    console.log(err);
  })
};
// Delete cart items

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.delProduct(prodId).then(
    res.redirect('/cart')
  ).catch(err => {console.log(err);
  });
  
};

// Post Orders

exports.postOrder = (req, res, next) => {
  const address = req.body.selectedAdd;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          address: address,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

//Get Order

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

//Get Address
exports.getAddress = (req, res, next) => {
  User.findById(req.user._id)
  .then(user => {
    if(user.address){
      res.render('shop/address',{
        pageTitle: 'Shipping Address',
        path: '/address',
        address: user.address      
      });
    }
  })
}
//Add-form
exports.getAddForm = (req, res, next) => {
  res.render('shop/add-form',{
    pageTitle: 'Add Address',
    path: 'add-form'
  })
}

//Post Address
exports.postAddress = (req, res, next) => {
  const name = req.body.name;
  const details = req.body.details;
  User.findById(req.user._id)
  .then(user => {
    const items = {
      name: name,
      details: details,

    }
    if(!user.address){
      const address = [];
      address.push(items);
      user.address = address
    }else{
    const add = user.address;
    add.push(items);
    user.address = add;
  }
    return user.save();
  })
  .then(() => {
    res.redirect('/address');
  }).catch(err =>{
    console.log(err);
  })

}
//Delete Address

exports.deleteAdd = (req, res, next) => {
  const addressId = req.params.addressId;
  User.findById(req.user._id)
  .then(user => {
    const newAddres = user.address.filter(add => {
      return add._id.toString() !== addressId;
    })
    user.address = newAddres;
    return user.save();
  })
  .then(() => {
    res.redirect('/address');
  }).catch(err => {
    console.log(err);
  })
}

//Checkout

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout',{
    pageTitle: 'Checkout',
    path: '/checkout'
  
  });
};

exports.getInvoice = (req, res, next) => {
  const invoiceId = req.params.orderId;
  const filePath = path.join('data','invoice', 'invoice_' + invoiceId + '.pdf');
  Order.findById(invoiceId).then((order) => {
    if(!order){
      throw new Error('No Orders Found');
    }
    const pdfFile = new PDFDocument();
  
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','inline');

  pdfFile.pipe(res);
  pdfFile.text('INVOICE',{ align: 'center' });
  pdfFile.text('_______________________________________________________',{align: 'center'});
  pdfFile.text(' ')
  pdfFile.text('OrderID : '+invoiceId);
  pdfFile.text('email : '+order.user.email);
  pdfFile.text('Products : '+order.products);
  pdfFile.end();
  }).catch(err => {
    console.log(err);
  })
  /*fs.readFile(filePath,(err, data) =>{
    if(err){
      console.log(err);
    }
    else{
      res.setHeader('Content-Type','image/png');
      res.setHeader('Content-Disposition','attachment');
      res.send(data);
    }
  })*/
}