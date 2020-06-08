const Product = require('../models/product');
const fileHelper = require('../util/file');

exports.getProduct = (req, res, next) => {
  Product.find({userId: req.user._id}).then((products) => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      
    });
  }).catch(err => {
    console.log(err);
  });
};


exports.getAddProduct= (req, res, next) => {
    res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editting: false,
      
    });
  };

  exports.postAddProduct= (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const userId = req.user;
    const product = new Product({
      title: title,
      price: price,
      description: description,
      imageUrl: image.path,
      userId: userId
    });
    product.save().then((result) => {
      //console.log(result);
      console.log('Product Created');
      res.redirect('/');
    }).catch(err => {
      console.log(err);
    });
  };

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.params.productId;
  Product.findById(prodId).then((proDuct) =>{
    if(!proDuct){
      return res.redirect('/');
    }
    res.render('admin/edit-product',{
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editting: editMode,
      product:proDuct
    })
  }).catch(err => {
    console.log(err);
  });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedimage = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  Product.findById(prodId).then((product) => {
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    if(updatedimage){
    fileHelper.deleteFile(product.imageUrl);
    product.imageUrl = updatedimage.path;  
    }
    return product.save();
  }).then((result) => {
   // console.log(result);
    console.log('Product Updated');
    res.redirect('/admin/products');
  }).catch(err => {
    console.log(err);
  })
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then((product) => {
    fileHelper.deleteFile(product.imageUrl);
    return Product.findByIdAndRemove(prodId);
  })
  .then(() => {
    console.log('Product Deleted');
    res.redirect('/admin/products');
  }).catch(err => {
    console.log(err);
  })
};