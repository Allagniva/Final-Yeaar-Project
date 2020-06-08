const express = require('express');

const User = require('../models/user');

const expValidate = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup',
expValidate.check('email')
.isEmail()
.withMessage('Please enter a valid email')
.custom((value, {req}) => {
   return User.findOne({ email: value })
    .then(userDoc => {
      if (userDoc) {
        return Promise.reject('Email Already Registered !');
      }
    })
}),
expValidate.check('password','**password must be atleast 5 Alphanumeric character').isLength({min: 5}).isAlphanumeric(),
expValidate.check('confirmPassword').custom((value, {req}) => {
    if(value !== req.body.password){
        throw new Error('Password not matching')
    }
    return true;
}),
authController.postSignup);

router.post('/logout',authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password',
expValidate.check('password','**password must be atleast 5 Alphanumeric character').isLength({min: 5}).isAlphanumeric(),
authController.postNewPassword);

module.exports = router;