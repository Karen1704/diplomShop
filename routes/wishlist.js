const Wishlist = require('../models/Wishlist')
const wishlistRouter = require('express').Router();
const Product = require('../models/Product')
const { auth, verifyAdmin, verifyAuthOrAdmin, verifyAdminOrProductManager } = require('../middleware/auth');


wishlistRouter.post('/create', auth, async (req, res) => {
    const newWishlist = new Wishlist({
        ...req.body,
        owner: req.user._id
    });
    try {
        await newWishlist.save();

        res.status(201).send(newWishlist)
    }
    catch (err) {
        res.status(400).send(err.message)
    }
})

wishlistRouter.get('/open', auth, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ owner: req.user._id }).populate('products');


        wishlist.products.forEach((product) => {
            product.image = undefined;
            product.video = undefined;
        })



        res.status(200).send(wishlist)
    }
    catch (err) {
        res.status(400).send(err.message)
    }
})

wishlistRouter.post('/add-product', auth, async (req, res) => {
    try {

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { owner: req.user._id },
            { $push: { products: req.body.product } },
            { new: true }
        );

        const product = await Product.findByIdAndUpdate(req.body.product, {
            $set: {
                inWishlist: true
            }
        }
        )


        res.status(200).send(updatedWishlist);

    }
    catch (err) {
        res.status(400).send(err.message)
    }
})

wishlistRouter.delete('/remove-product', auth, async (req, res) => {
    try {

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { owner: req.user._id },
            { $pull: { products: req.body.product } },
            { new: true }
        );


        const product = await Product.findByIdAndUpdate(req.body.product, {
            $set: {
                inWishlist: false
            }
        }
        )


        res.status(200).send(updatedWishlist);

    }
    catch (err) {
        res.status(400).send(err.message)
    }
})








module.exports = wishlistRouter;