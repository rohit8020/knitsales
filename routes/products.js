var express = require("express");
var router = express.Router();
var Product = require("../models/product");
var middleware = require("../middleware");
var fileHelper = require("../file");
var { body } = require('express-validator/check');
var { validationResult } = require('express-validator/check');
   

//INDEX -show all products
router.get("/", function(req, res){
    //get all products from database
    Product.find({}, function(err, allproducts){
        if(err){
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
        } else {
            res.render("products/index", {products: allproducts});
        }
    })
});

//CRAETE -add new product to DB
router.post("/",middleware.isLoggedIn, [
    body('name')
      .isString()
      .isLength({ min: 5 })
      .withMessage("The Name should be of minimum 3 letters!!")
      .trim(),
    body('price').isNumeric().withMessage("The price should be of Numeric type!!"),
    body('description')
      .isLength({ min: 5, max: 400 })
      .withMessage("The Description should we min of 5 letters and max 500 letters!!")
      .trim()
  ], function(req, res){
   //get data from form and add to products array
   var name = req.body.name;
   var image = req.file;
   var price = req.body.price;
   var description = req.body.description;
   if(!image){
        req.flash("error", "The file is not of jpg/jpeg/png Type OR File Size is greater then 100kb!!");
        return res.redirect("back");
   }

   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      console.log(errors.array());
      fileHelper.deleteFile(image.path);
      req.flash("error", errors.array()[0].msg);
      return res.redirect('products/new');
   }

   var image = image.path;
   var author = {
       id: req.user._id,
       email: req.user.email
   }
   var newProduct = {name: name, image: image, description: description, author: author, price: price};
   //create a new product and save to database
   Product.create(newProduct, function(err, newlyCreated){
       if(err){
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
       }else{
           //redirect back to products page
           req.flash("success", "Product Created Successfully!!")
           res.redirect("/products");
       }
   });
});

//NEW -show form to create new product
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("products/new"); 
});

//SHOW --DETAIL BY ID 
router.get("/:id", function(req, res){
     //find the product with provided id
     Product.findById(req.params.id,function(err, foundProduct){
         if(err){
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
         } else{
             //render the show template with that product
             res.render("products/show", {product: foundProduct});
         }
     });
});

//EDIT PRODUCT ROUTE
router.get("/:id/edit", middleware.checkProductOwnership, function(req, res) {
            Product.findById(req.params.id, function(err, foundProduct){
            res.render("products/edit", {product: foundProduct});
        });
});

//UPDATE PRODUCT ROUTE
router.put("/:id", middleware.checkProductOwnership, [
    body('name')
      .isString()
      .isLength({ min: 3 })
      .withMessage("The Name should be of minimum 3 letters!!")
      .trim(),
    body('price').isFloat().withMessage("The price should be of float type!!"),
    body('description')
      .isLength({ min: 5, max: 400 })
      .withMessage("The Description should we min of 5 letters and max 500 letters!!")
      .trim()
  ],function(req, res){

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if(req.file){
            fileHelper.deleteFile(req.file.path);
        }
        req.flash("error", errors.array()[0].msg);
        return res.redirect('back');
    }
    //find and update the correct product
    var image = req.file;
    Product.findById(req.params.id, function(err, product){
        if(err){
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
        } else{
            product.name=req.body.name;
            product.price=req.body.price;
            product.description=req.body.description;
            if(image){
                fileHelper.deleteFile(product.image);
                product.image=image.path;
            }
            return product.save().then(result => {
                req.flash("success", "Product Updated Successfully!!")
                res.redirect("/products/" + req.params.id);
            });
            
        }
    });
});

//DESTROY PRODUCT ROUTE 
router.delete("/:id", middleware.checkProductOwnership, function(req, res){
    Product.findById(req.params.id, function(err, product){
        if(err)
        {
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
        }else{
            fileHelper.deleteFile(product.image);
        }
    })
    Product.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash("error", "Sorry For Inconvenience, Some Server Problem!!")
            res.redirect("back");
        } else {
            req.flash("success", "Product Deleted Successfully!!")
            res.redirect("/products");
        }
    })
})

module.exports = router;
