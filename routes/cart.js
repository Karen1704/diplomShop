const cartRouter = require('express').Router();
const Cart = require('../models/Cart');
const { auth , verifyAdminOrProductManager } = require('../middleware/auth');

cartRouter.post('/create', auth, async (req, res) => {
    const newCart = new Cart({
        owner:req.user._id,
        products:req.body.products
    });
    try {
        await newCart.save();
        res.status(201).send(newCart);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
});


//Find Cart by owner id
cartRouter.get('/find/:id', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({owner:req.user._id}).populate('products')
        if (!cart) {
            return res.status(404).send("There is no cart with this id")
        }

        res.status(200).send(cart);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


cartRouter.post('/add-product', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ owner: req.user._id });

        if (!cart) {
            return res.status(404).send({ error: "Cart not found" });
        }

        if(!req.body.product){
            return res.status(404).send("product field is empty")
        }
        cart.products.push(req.body.product); // Assuming req.body.product contains the product to be added
        await cart.save();
        
        res.status(200).send(cart);
    } catch (err) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});


cartRouter.delete('/remove-product', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ owner: req.user._id });

        if (!cart) {
            return res.status(404).send({ error: "Cart not found" });
        }

        cart.products = cart.products.filter(product => product._id != req.body.productId); // Assuming productId is passed as a route parameter
        await cart.save();
        
        res.status(200).send(cart); 
    } catch (err) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});



cartRouter.delete('/clear-cart', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ owner: req.user._id });

        if (!cart) {
            return res.status(404).send({ error: "Cart not found" });
        }

        cart.products = [];
        await cart.save();
        
        res.status(200).send(cart);
    } catch (err) {
        res.status(500).send({ error: "Internal Server Error" });
    }
});

module.exports = cartRouter; 
