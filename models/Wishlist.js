const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        unique:true
    }
})





const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;