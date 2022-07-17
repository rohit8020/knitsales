var middlewareObj = {};
var Product = require("../models/product");

middlewareObj.checkProductOwnership = function(req, res, next){
    if(req.isAuthenticated()){
            Product.findById(req.params.id, function(err, foundProduct){
            if(err){
                req.flash("error", "Product NOT FOUND!!")
                res.redirect("back");
            } else {
                 //does the user own the product?
                 if(foundProduct.author.id.equals(req.user._id)){
                     next();
                 } else{
                     req.flash("error", "You Don't Have That Permission")
                     res.redirect("back");
                 }
            }
        });
    } else{
        req.flash("error", "Please LogIn First!!")
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Please LogIn First!!")
    res.redirect("/login");
}

module.exports = middlewareObj;