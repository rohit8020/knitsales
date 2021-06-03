var mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
    name: String,
    image: String,
    price: String,
    description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        email: String
        
    }
});

module.exports = mongoose.model("Product", productSchema);