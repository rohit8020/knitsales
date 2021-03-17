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
        username: String
        
    }
});

module.exports = mongoose.model("Product", productSchema);