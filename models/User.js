const mongoose = require('mongoose');
const validator  = require("validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
        },
        name:{
            type:String,
            required:true
        },
        isVerified:{
          type:Boolean,
          // default:false
          default:true

        },
        verificationCode:{
          type:String,
        },
        passwordResetCode:{
          type:String
        },
        email:{
            type:String,
            trim:true,
            lowercase:true,
            unique:true,
            required:true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw new Error('Email is not valid')
                }
            }
        },
        avatar:{
          type:Buffer
        },
        avatar_url:{
          type:String
        },
        password:{
            type:String,
            required:true,
            minLength:8,
            validate(value) {
                if (value.toLowerCase().includes("password")) {
                  throw new Error("Password can not contain the word 'password' ");
                }
              },
        },
        role:{
            type:String,
            default:"user",
            enum: ['admin', 'user','productManager']
        },
        tokens: [
            {
              token: {
                type: String,
                required: true,
              },
            },
          ],
    },{timestamps:true}
)

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
  
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
  };

  userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({ username });
  
    if (!user) {
      throw new Error("Unable to login");
    }
  
    const isMatch =  await bcrypt.compare(password, user.password);
  
    if (!isMatch) {
      throw new Error("Unable to log in");
    }
    
        return user;
    
  
    
  };
  

  userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
  
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
  
    return userObject;
  };


//Hash the password before saving
userSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
  
    next();
  });


  userSchema.virtual('wishlist',{
    ref:"Wishlist",
    localField:"_id",
    foreignField:"owner"
  })


  userSchema.virtual('reviews',{
    ref:"Review",
    localField:"_id",
    foreignField:"owner"
  })

  const User = mongoose.model("User", userSchema);

  module.exports = User;