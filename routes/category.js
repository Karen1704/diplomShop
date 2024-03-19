const Category = require('../models/Category')
const categoryRouter = require('express').Router();
const { auth, verifyAdmin, verifyAuthOrAdmin, verifyAdminOrProductManager } = require('../middleware/auth');


categoryRouter.post('/add', verifyAdminOrProductManager, async (req, res) => {
    const newcategory = new Category(req.body);
    try {
        await newcategory.save();

        res.status(201).send(newcategory)
    }
    catch (err) {
        res.status(400).send(err.message)
    }
})




//Find category by Id
categoryRouter.get('/find/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
        if (!category) {
            return res.status(404).send("There is no category with given id")
        }
        res.status(200).send(category);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


categoryRouter.get('/all', async (req, res) => {
    try {
        const categories = await Category.find({})
        if (!categories) {
            return res.status(404).send("There is no category")
        }
        res.status(200).send(categories);
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
}
)





categoryRouter.patch('/update/:id', verifyAdminOrProductManager, async (req, res) => {
    try {
        const updatedcategory = await Category.findByIdAndUpdate(req.params.id, {
            $set: req.body
        }, { new: true })
        if (!updatedcategory) {
            return res.status(404).send("No category with this id")
        }
        res.status(200).send(updatedcategory)
    } catch (err) {
        res.status(400).send(err.message);
    }
})


categoryRouter.delete('/delete/:id', verifyAdminOrProductManager, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).send("No category with given id")
        }
        res.status(200).send("category was deleted")
    }
    catch (err) {
        res.status(400).send({
            "Error": err.message
        })
    }
})


module.exports = categoryRouter;