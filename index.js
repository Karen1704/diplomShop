const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv')
const userRouter = require('./routes/user');
const movieRouter = require('./routes/movie');
const directorRouter = require('./routes/director');

dotenv.config();




mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(()=>console.log("Database Connected Successfully!"))
    .catch((err)=>console.log(err))


const app = express();
app.use(express.json());


app.use('/api/users',userRouter);
app.use('/api/movies',movieRouter);
app.use('/api/directors',directorRouter);



app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server is running");
})


