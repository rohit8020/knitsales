var  path = require('path'),
     express = require("express"),
     app = express(),
     bodyParser = require("body-parser"),
     mongoose = require("mongoose"),
     flash = require("connect-flash"), 
     passport = require("passport"),
     LocalStrategy = require("passport-local"),
     methodOverride = require("method-override"),
     User = require("./models/user"),
     Product = require("./models/product"),
     nodemailer = require('nodemailer'),
     multer = require("multer");
const { json } = require("express");
const { google } = require('googleapis');
const { file } = require("googleapis/build/src/apis/file");



     
//requiring routes
var productRoutes = require("./routes/products"),
    indexRoutes      = require("./routes/index")

//passport configuration
app.use(require("express-session")({
    secret: "hey this is secret!!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var url = process.env.DATABASEURL || "mongodb://localhost/knit" ;

mongoose.connect(url);

var fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

var fileFilter = (req, file, cb) => {
    if( (file.mimetype === "image/jpg"|| 
        file.mimetype === "image/jpeg"||
        file.mimetype === "image/png")
      ){
        cb(null, true);
    }else{
        cb(null, false);
    }
}
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use("/images",express.static(path.join(__dirname, "images")));
app.use(methodOverride("_method"));
app.use(flash());


app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.use("/", indexRoutes);
app.use("/products", productRoutes);

app.listen(process.env.PORT,process.env.IP, function(){
    console.log("The knitsales Server has started!"); 
 });
 