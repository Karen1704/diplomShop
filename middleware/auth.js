const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate" });
  }
};


const verifyAdmin = async (req,res,next)=>{
    try{
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token,
        });
        if (!user) {
            throw new Error();
        }
        if(user.role==="admin"){
            next();
        }
        else{
            res.status(403).send({"error":"You are not allowed"});
        }
      
    }
    catch(err){
        res.status(401).send({ err: "Please authenticate" });
    }
}



const verifyAuthOrAdmin = async (req,res,next)=>{
    try{
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token,
        });
        if (!user) {
            throw new Error();
        }
        if(user.role ==="admin" || decoded._id === req.params.id){
            next();
        }
        else{
            res.status(403).send({"error":"You are not allowed"});
        }
      
    }
    catch(err){
        res.status(401).send({ err: "Please authenticate" });
    }
}


const verifyAdminOrProductManager = async (req,res,next)=>{
    try{
        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({
            _id: decoded._id,
            "tokens.token": token,
        });
        if (!user) {
            throw new Error();
        }
        if(user.role==="admin" || user.role==="productManager"){
            next();
        }
        else{
            res.status(403).send({"error":"You are not allowed"});
        }
      
    }
    catch(err){
        res.status(401).send({ err: "Please authenticate" });
    }
}


module.exports = {auth,verifyAdmin, verifyAuthOrAdmin, verifyAdminOrProductManager};
