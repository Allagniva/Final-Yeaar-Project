const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const expValidate = require('express-validator');

const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_key: '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'
  }
}));

exports.getLogin = (req, res, next) => { 
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('loginErr')
  });
};
exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: '',
    email: '',
    password: '',
    confirmPassword: '',
    error: []
  });
};
exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
  .then(user => {
    if(!user){
      req.flash('loginErr','Email not Registered !');
      res.redirect('/login')
    }else{
      bcrypt.compare(password, user.password)
      .then(doMatch => {
        if(doMatch){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            res.redirect('/');
          })
        }
        req.flash('loginErr','Invalid Password !')
        res.redirect('/login')
      })
      .catch(err => {
        console.log(err);
        res.redirect('/login')
      });
    }
  })
  .catch(err => {console.log(err);})
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const error = expValidate.validationResult(req);
  if(!error.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: error.errors[0].msg,
      email: email,
      password: password,
      confirmPassword: req.body.confirmPassword,
      error: error.errors[0] //error css purpose
    });
  }
        bcrypt.hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          return transporter.sendMail({
            to: email,
            from: 'donotreply@nodemailer.com',
            subject: 'Successful Signup',
            html: '<h1>Welcome to the Practice Node Site</h1>'
          });
        }).then((result) => {
          console.log(result);
          res.redirect('/login');
        })
        .catch(err => console.log(err));
      }

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect('/');
    console.log(err);
  });
};

exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: req.flash('resetErr')
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('resetErr','Invalid Email Address');
          res.redirect('/reset');
        }else{
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          user.save().then(result => {
            res.redirect('/');
            transporter.sendMail({
              to: req.body.email,
              from: 'shop@node-complete.com',
              subject: 'Password reset',
              html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
              `
            });
          }).catch(err => {
            console.log(err);
          })
        }
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        userId: user._id.toString(),
        passwordToken: token,
        password: '',
        error: [],
        errorMessage: ''
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const error = expValidate.validationResult(req);
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      if(!error.isEmpty()){
        return res.status(422).render('auth/new-password', {
          path: '/new-password',
          pageTitle: 'New Password',
          errorMessage: error.errors[0].msg,
          password: newPassword,
          error: error.errors[0],
          userId: userId,
          passwordToken: passwordToken
        });
      }else{
        bcrypt.hash(newPassword, 12).then(hashedPassword => {
          resetUser.password = hashedPassword;
          resetUser.resetToken = undefined;
          resetUser.resetTokenExpiration = undefined;
          return resetUser.save();
        })
        .then(result => {
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
        });
      }
    }).catch(err => {
      console.log(err);
    })
};