const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    short_description:{
        type:String,
    },
    price:{
        type:Number,
        required:true
    },
    code:{
        type:String,
        required:true,
        unique:true
    },
    inWishlist:{
        type:Boolean,
        default:false
    },
    categories:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Category'
    }],
    rating:{
        type:Number,
        default:0,
        max:10
    },
    image:{
        type:Buffer,
    },
    image_url:{
        type:String
    },
    reviews:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review"
    }]

},{timestamps:true})



// productSchema.virtual("reviews", {
//     ref: "Review",
//     localField: "_id",
//     foreignField: "product",
//   });
  




//   productSchema.index({ 'reviews.owner': 1, 'reviews.vote': 1 });


const Product = mongoose.model("Product",productSchema);
module.exports = Product;



