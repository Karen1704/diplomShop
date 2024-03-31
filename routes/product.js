const productRouter = require('express').Router();
const Product = require('../models/Product');
const { auth, verifyAdmin, verifyAuthOrAdmin, verifyAdminOrProductManager } = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');

//Creating products
productRouter.post('/add', verifyAdminOrProductManager, async (req, res) => {
    const newProduct = new Product(req.body);
    try {
        await newProduct.save();

        res.status(201).send(newProduct);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
});


//Find Product by Id
productRouter.get('/find/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categories')
            .populate({
                path: 'reviews',
                populate: "owner"
            })
        if (!product) {
            return res.status(404).send("There is no product with this id")
        }
        const { image, ...others } = product._doc;


        res.status(200).send(others);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


//Find product by SKU code
productRouter.get('/findByCode', async (req, res) => {
    try {
        const product = await Product.findOne({
            code:req.body.code
        })
            .populate('categories')
            .populate({
                path: 'reviews',
                populate: "owner"
            })
        if (!product) {
            return res.status(404).send("There is no product with this code")
        }
        const { image, ...others } = product._doc;


        res.status(200).send(others);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


//Get all Products
productRouter.get('/all', async (req, res) => {
    try {
        const name = req.query.name;
        const category = req.query.category;
        const code = req.query.code;
        const sortOrder = req.query.sortOrder || 'asc';
        const sortBy = req.query.sortBy;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 9;
        const skip = (page - 1) * limit;

        let sortCriteria = {};
        let query = {}

        // Object.keys(req.query).foreach((myQuery)=>{
        //     query[myQuery]=req.query[myQuery];
        // })



        switch (true) {
            case !!name:
                query.name = { $regex: name, $options: "i" }    // name && (query.name = { $regex: name, $options: "i" })
                break;
            case !!category:
                query.categories = { $in: category }                    // category && (query.category = { $in: category });
                break;
                break;
            case !!code:
                query.code = { $regex: code, $options: "i" }                   // category && (query.category = { $in: category });
                break
        }

        if (sortBy && sortBy === 'rating') {
            sortCriteria.rating = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy && sortBy === 'name') {
            sortCriteria.name = sortOrder === 'desc' ? -1 : 1;
        } else if (sortBy && sortBy === 'year') {
            sortCriteria.release_year = sortOrder === 'desc' ? -1 : 1;
        }

        let products;
        if (sortCriteria.length === 0) {
            products = await Product.find(query).skip(skip).limit(limit)
                .populate('categories')
        }
        else {
            products = await Product.find(query).sort(sortCriteria).skip(skip).limit(limit)
                .populate('categories')
        }

        if (!products || products.length === 0) {
            return res.status(404).send("No products")
        }

        const others = [];
        for (let i = 0; i < products.length; i++) {
            const { image, video, ...other } = products[i]._doc;
            others.push(other)
        }


        res.status(200).send(others)
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})

//Update a Product
productRouter.patch('/update/:id', verifyAdminOrProductManager, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true })
        if (!updatedProduct) {
            return res.status(404).send("No product with this id")
        }
        const { image, ...others } = updatedProduct._doc;
        res.status(200).send(others)
    } catch (err) {
        res.status(400).send(err.message);
    }
})


//Delete a Product
productRouter.delete('/delete/:id', verifyAdminOrProductManager, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send("No product with given id")
        }
        res.status(200).send("Product was deleted")
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


const uploadImage = multer({
    limits: {
        fileSize: 100000,
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload an image'))
        }
        callback(undefined, true)
    }
});

productRouter.post('/image/:id', verifyAdminOrProductManager, uploadImage.single('image'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({ width: 300, height: 400 }).jpeg().toBuffer();
        const product = await Product.findById(req.params.id);

        product.image = buffer;
        product.image_url = `${process.env.URL}/api/products/image/${product._id}`
        await product.save();

        const { image, video, ...others } = product._doc;
        res.status(200).send(others)

    }
    catch (err) {
        res.status(400).send({ "Error": err.message })
    }
})

//Get product image
productRouter.get('/image/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product.image) {
            throw new Error();
        }

        res.set("Content-Type", "image/png");
        res.status(200).send(product.image);
    } catch (err) {
        res.status(400).send({ "Error": err.message });
    }
})


//Delete product image

productRouter.delete("/image/:id", verifyAdminOrProductManager, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.image = undefined;
        await product.save();
        res.status(200).send({
            "message": "Product image was removed",
            "product": product.name
        });
    }
    catch (err) {
        res.status(400).send({ "Error": err.message })
    }
});



//Product video

const uploadVideo = multer({
    limits: {
        fileSize: 100000000,
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(mp4|avi|mkv)$/)) {
            return callback(new Error('Please upload a video'))
        }
        callback(undefined, true)
    }
});


productRouter.post('/video/:id', verifyAdminOrProductManager, uploadVideo.single('video'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        product.video = req.file.buffer;
        await product.save();

        res.status(200).send(product)

    }
    catch (err) {
        res.status(400).send({ "Error": err.message })
        console.log(err)
    }
})


//Get product video
productRouter.get('/video/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product.video) {
            throw new Error;
        }

        // res.set("Content-Type", "video/");
        res.status(200).send(product.video);
    } catch (err) {
        res.status(400).send({ "Error": err.message });
        console.log(err)
    }
})


productRouter.delete("/video/:id", verifyAdminOrProductManager, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.video = undefined;
        await product.save();
        res.status(200).send({
            "message": "Product image was removed",
            "product": {
                "name": product.name,
                "id": product._id
            },

        });
    }
    catch (err) {
        res.status(400).send({ "Error": err.message })
    }
});





module.exports = productRouter; 