const mongoose = require('mongoose');

const categorieschema  = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
},{timestamps:true})

// categorieschema.virtual('products',{
//       ref:'Product',
//       localField:'_id',
//       foreignField:'categories'  
// })

const Category = mongoose.model('Category',categorieschema);
module.exports = Category; 



