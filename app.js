const flash = require('connect-flash');
const path = require('path');
const User = require('./models/user');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://nodeplus:nodeplus@mycluster-dbkw2.mongodb.net/test';

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');

const errorController = require('./controllers/error');

const app = express();

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions' 
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
app.use(flash());
const csrfProtection = csrf({});
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  } ,
  filename: (req, file, callback) => {
    var today = new Date();
    var date = today.getFullYear()+'.'+(today.getMonth()+1)+'.'+today.getDate();
    var time = today.getHours() + "." + today.getMinutes() + "." + today.getSeconds();
    var dateTime = date+'_'+time;
    callback(null, dateTime + '-' + file.originalname);
  }
});
const filter = (req, file, callback) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    callback(null, true);
  }else{
    callback(null, false);
  }
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: filter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({ 
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false, 
    store: store })
);


app.use((req, res, next) => {
  if(!req.session.user){
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(err => {console.log(err)});
})
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.getError);

mongoose.connect(MONGODB_URI)
.then(result =>{
  app.listen(3000);
  console.log('Listening to port 3000');
})
.catch(err => console.log(err));