var express  = require("express");
var router   = express.Router();
var passport = require("passport");
var User     = require("../models/user");
var middleware = require("../middleware");

var { body } = require('express-validator/check');
var { validationResult } = require('express-validator/check');

const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// These id's and secrets should come from .env file.
const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const USER_EMAIL    = process.env.USER_EMAIL

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(userId, email, task) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });
    
    const url = `https://knitsales.herokuapp.com/${task}/${userId}`;

    const mailOptions = {
      to: `${email}`,
      subject: 'CONFIRM EMAIL',
      text: 'Confirm Your Email!',
      html: `Please click this link to confirm your email: <a href="${url}">${url}</a>`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
    return res.redirect("back");;
  }
}

//root route
router.get("/", function(req, res){
   res.render("products/landing"); 
});

//about route
router.get("/about",function(req,res){
    res.render("products/about");
});

//contact route
router.get("/contact",function(req,res){
    res.render("products/contact");
})

//show register form
router.get("/register", function(req, res) {
    res.render("signInOut/register");
});

//handle signup logic
router.post("/register", [

  body('username')
  .isLength({ min: 5 })
  .withMessage('Username should be of Minimum of 5 Characters!!')
  .trim(),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.')
    .custom((value, { req }) => {
      if (!value.endsWith("knit.ac.in")) {
        throw new Error('The Email Should be Your Official College Email!!');
      }
      return true;
    })
    .normalizeEmail(),
  body('password')
    .isLength({ min: 5 })
    .withMessage('Password Should Alphanumeric and Minimum of 5 Characters!!')
    .isAlphanumeric()
    .trim()
],function(req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash("error", errors.array()[0].msg);
      return res.redirect('back');
    }
    var newUser = new User({username: req.body.username, email: req.body.email, confirmed: false});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message)
            res.redirect("signInOut/register");
        } 
        // passport.authenticate("local")(req, res, function(){
            let task = "emailConfirmation"
            sendMail(user._id, user.email, task)
            .then((result) => {
              if(result){
                // console.log(result);
                req.flash("success", "Welcome To KnitSales " + user.username + ". CONFIRM YOUR EMAIL!");
                res.redirect("/");
              }
            }
            )
            .catch((error) => {
              // console.log(error)
              if(error){
                req.flash("error", "Sorry For Inconvenience, Some Server Problem!")
                res.redirect("/");
              }
            } 
            );
    });
});

router.get("/emailConfirmation/:userId", function(req, res) {
    User.findByIdAndUpdate(req.params.userId, { $set: {confirmed : true}},function(err, user){
        if(err){
          req.flash("error", "Sorry For Inconvenience, Some Server Problem!")
          res.redirect("/");
        }else{
          user.confirmed=true;
          res.render("signInOut/confirm_login",{userConfirmed: user.confirmed});
        }
    });
    
});

//show login form
router.get("/login", function(req, res) {
    res.render("signInOut/login");
});



//handling login logic
router.post("/login", function(req, res, next){
    User.findOne({username: req.body.username},function(err, user){
      if(err){
        req.flash("error", "Sorry For Inconvenience, Some Server Problem!")
        res.redirect("/");
      }
      if(user){
      if(!user.confirmed )
      {
        req.flash("error", "Confirm Your Email!")
        res.redirect("/");
      }else{
      passport.authenticate("local", {
            successRedirect: "/products",
            failureRedirect: "signInOut/login",
            failureFlash: "Invalid username or password!!",
            successFlash: "Logged In Successfully!!"
      })(req, res, next)
      }
    }else{
      const errorMsg="Enter Correct Input to LogIn!";
      req.flash("error", errorMsg);
      res.redirect('back');
    }
    })
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("error", "Logged You Out!!");
    res.redirect("/products");
})


module.exports = router;