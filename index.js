const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config();
const userRouter = require('./routes/user');
const productRourer = require('./routes/product');
const categoryRouter = require('./routes/category');
const wishlistRouter = require('./routes/wishlist');
const reviewRouter = require('./routes/review');
const cartRouter = require('./routes/cart');





    mongoose.connect(process.env.MONGO_URL,{
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(()=>console.log("Database Connected Successfully!"))
    .catch((err)=>console.log(err))


const app = express()
app.use(express.json());


app.use('/api/users',userRouter);
app.use('/api/products',productRourer);
app.use('/api/categories',categoryRouter);
app.use('/api/wishlist',wishlistRouter);
app.use('/api/reviews',reviewRouter);
app.use('/api/carts',cartRouter);



app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server is running");
})


