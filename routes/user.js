const userRouter = require('express').Router();
const User = require('../models/User');
const { auth, verifyAdmin, verifyAuthOrAdmin } = require('../middleware/auth');
const { Error } = require('mongoose');
const multer = require("multer");
const sharp = require('sharp');
const { sendWelcomeEmail, cancelationEmail, passwordResetEmail, verificationCodeEmail } = require('../email/account')
const crypto = require('crypto');
const { errorMonitor } = require('events');


//Register a new User

userRouter.post('/register', async (req, res) => {
  const newUser = new User({
    ...req.body,
    role: "user",
    verificationCode: crypto.randomBytes(15).toString('hex')
  })

  try {
    await newUser.save();
    sendWelcomeEmail(newUser.email, newUser.name, newUser.verificationCode);
    const token = await newUser.generateAuthToken();
    const { verificationCode, password, ...user } = newUser._doc;
    res.status(201).send({ user, token })
  } catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

//Send Verification Code
userRouter.patch('/verifactionCode', async (req, res) => {
  try {
    const email = req.body.email;
    const user = await  User.findOneAndUpdate({ email }, {
      $set: { verificationCode: crypto.randomBytes(15).toString('hex') }
    },{new:true})
    if (!user) {
      res.status(404).send({
        "Error": "No user with given email address"
      })
    }
    await user.save();
    await verificationCodeEmail(email, user.name, user.verificationCode)
    const { verificationCode, ...others } = user._doc;
    res.status(200).send(others);
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

//Verify User
userRouter.patch('/verify/:verificationCode', async (req, res) => {
  try {
    const verificationCode = req.params.verificationCode
    const user = await User.findOneAndUpdate({ verificationCode }, {
      $set: {
        isVerified: true,
        verificationCode: null
      }
    }, { new: true })
    if (!user) {
      return res.status(404).send({
        "Error": "Verification code is expired"
      })
    }
    res.status(200).send({
      "Message": "You are Verified"
    })
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

//Verify User Get
userRouter.get('/verify/:verificationCode', async (req, res) => {
  try {
    const verificationCode = req.params.verificationCode
    const user = await User.findOneAndUpdate({ verificationCode }, {
      $set: {
        isVerified: true,
        verificationCode: null
      }
    }, { new: true })
    if (!user) {
      return res.status(404).send({
        "Error": "Verification code is expired"
      })
    }
    res.redirect('..')
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})


//Reset user password
userRouter.patch('/passwordReset', async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOneAndUpdate({ email }, {
      $set: {
        passwordResetCode: crypto.randomBytes(15).toString('hex')
      }
    }, { new: true });
    if (!user) {
      return res.status(404).send({
        "Error": "No user with given email"
      })
    }
    await user.save();
    await passwordResetEmail(email, user.name, user.passwordResetCode)
    res.status(200).send({
      "Message": "Please, check your email"
    })

  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

//Check if there is user with given password Reset code
userRouter.get('/resetCode/:code', async (req, res) => {
  try {
    const passwordResetCode = req.params.code
    const user = await User.findOne({ passwordResetCode });
    if (!user) {
      return res.status(401).send({
        "Error": "Code is expired"
      })
    }
    res.status(200).send({
      "Message": "Code is active"
    })
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

userRouter.patch('/resetCode/:code', async (req, res) => {
  const updates = Object.keys(req.body);
  // updates.push()


  const allowedUpdates = ["password"];

  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  })

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid upadate!" });
  }
  updates.push("passwordResetCode");
  try {
    const passwordResetCode = req.params.code

    const updatedUser = await User.findOne({ passwordResetCode })
    if (!updatedUser) {
      return res.status(401).send({
        "Error": "Code is expired"
      })
    }

    updates.forEach((update) => {
      updatedUser[update] = req.body[update];
    });



    await updatedUser.save();
    res.status(200).send({
      "Message": "Your password is reset",
      "user": updatedUser
    })
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
    console.log(err)
  }
})


//Log in a User
userRouter.post("/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.username,
      req.body.password
    );
    if (!user.isVerified) {
      return res.status(401).send({
        "Error": "You are not verified, please check your email address"
      })
    }

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send({ "Error": e.message });
  }
});

//Get All Users
userRouter.get('/all', verifyAdmin, async (req, res) => {
  try {
    let query = {};
    const role = req.query.role;
    switch (true) {
      case !!role:
        query.role = req.query.role
        break
    }
    const users = await User.find(query);
    res.send(users);
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})


//Get Me 
userRouter.get('/me', auth, async (req, res) => {
  try {

    res.status(200).send(req.user);

  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})

//Get user by id
userRouter.get('/find/:id', verifyAuthOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).send({ user });
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})







//Update a User
userRouter.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "username", "email", "password", "age"];

  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  })

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid upadate!" });
  }
  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();
    res.status(200).send(req.user);
  } catch (err) {
    res.status(400).send(err.message);
  }
})


//Delete me
userRouter.delete('/me', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).send("User was deleted")
    cancelationEmail(req.user.email, req.user.name)
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})


//Log out a user
userRouter.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save();
    res.status(200).send("User was logged out")
  }
  catch (err) {
    res.status(400).send({
      "Error": err.message
    })
  }
})






//Make a user admin or products Manager
userRouter.patch('/changerole/:id', verifyAdmin, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["role"];

  const user = await User.findById(req.params.id)

  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  })

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid upadate!" });
  }

  try {
    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();
    res.status(200).send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
})

//Upload avatar for user

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image(jpg or png)'))
    }

    cb(undefined, true)
  }
})

userRouter.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).jpeg().toBuffer();

  req.user.avatar = buffer;
  req.user.avatar_url = `${process.env.URL}/api/users/avatar`
  await req.user.save();
  res.status(200).send(req.user);

},
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
)


//Get user avatar
userRouter.get('/avatar', auth, async (req, res) => {
  try {
    if (!req.user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(req.user.avatar);
  } catch (e) {
    res.status(400).send({ "Error": err.message });
  }
})


//Delete user avatar

userRouter.delete("/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.status(200).send({
      "message": "User's avatar was removed",
      "user": req.user
    });
  }
  catch (err) {
    res.status(400).send({ "Error": err.message })
  }
});












module.exports = userRouter;