const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required: true,
        unique:true,
    },
    products:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
    }],
}, { timestamps: true })









const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;