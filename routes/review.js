const mongoose = require('mongoose');
const reviewRouter = require('express').Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, verifyAdmin, verifyAuthOrAdmin, verifyAdminOrProductManager } = require('../middleware/auth');


reviewRouter.post('/add', auth, async (req, res) => {
    const newReview = new Review({
        ...req.body,
        owner:req.user._id
    });
    try {
        await  Product.findByIdAndUpdate(req.body.product,{ $push: { reviews: newReview._id } })
        await newReview.save();

        res.status(201).send(newReview)
    }
    catch (err) {
        res.status(400).send(err.message)
        console.log(err)
    }
})


reviewRouter.delete('/delete/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).send("No reviw with given id")
        }
        if(req.user._id.toString()  !== review.owner.toString() && req.user.role !== 'admin') {
            return res.status(401).send({"Error":"You are not allowed"});
        }
        const deletedReview = await Review.findByIdAndDelete(req.params.id)
      
        if (!deletedReview) {
            return res.status(404).send("No reviw with given id")
        }
        res.status(200).send({
            "Message":`Review with id ${req.params.id} was deleted`
        })
    }
    catch (err) {
        res.status(400).send(err.message)
    }
})

reviewRouter.get('/my', auth, async (req,res)=> {
    try{
        const reviews = await req.user.populate( {path: "reviews"});
        if(!reviews){
            return res.status(404).send({
                "Message":"You have no reviews"
            })
        }

        res.status(200).send(req.user.reviews)

    }
    catch(err){
        res.status(400).send({
            "Error":err.message
        })
    }
})


module.exports = reviewRouter;