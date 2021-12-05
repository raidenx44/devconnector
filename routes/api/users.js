const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// const { check, validationResult } = require('express-validator/check') // express-validator in the Udemy course
const { check, validationResult } = require('express-validator'); //express-validator

const User = require('../../models/User');

/* // @route   GET api/users
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('User route')); */

// @route   POST api/users
// @desc    Register User
// @access  Public
// Adding async (req, res) => 
router.post('/', [
    check('name','Name is required')
    .not()
    .isEmpty(),
    check('email','Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], 
async (req, res) => {
    // console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
    // See if the user's exist
    let user = await User.findOne({ email });

    if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Get User's Gravatar
    const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
    });

    user = new User ({
        name, 
        email,
        avatar,
        password
    });

    // Encrypt password using Bcrypt
    const salt = await bcrypt.genSalt(10);
    
    user.password = await bcrypt.hash(password, salt);

    // Save user details in the database

    await user.save();


    // Return jsonwebtoken
    const payload = {
        user: {
            id: user.id
        }
    }

    jwt.sign(payload, config.get('jwtSecret'), 
    { expiresIn: 360000 }, 
    (err, token) => {
        if (err) throw err;
        res.json({ token });
    });

    // res.send('User registered');

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
  
});

module.exports = router;


