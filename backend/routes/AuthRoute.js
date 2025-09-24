import express from 'express'
import multer from 'multer';

import rateLimit from 'express-rate-limit';

import {
    // auth & account
    userRegisterController,
    userLoginController,
    updateUserProfileController,
    updateShopProfileController,
    deleteUserProfileController,
    deleteShopProfileController,
    // listing / metrics
    getAllShopsController,
    getAllUsersController,
    getTotalShopCountController,
    getTotalUserCountController,
    getUserGrowthController,
    getShopGrowthController,
    getShopCountByCategoryController,
    // media
    logoController,
    // secure reset
    requestPasswordReset,
    performPasswordReset,
    // misc
    shopRegisterController,
    testcontroller,
} from '../controllers/AuthController.js';

import { isAdmin, requireSignIn } from '../middlewares/AuthMiddleware.js'

import passport from 'passport';
import jwt from "jsonwebtoken";


//router object
const router = express.Router()

// Configure Multer to store the file in memory (not on disk)
const storage = multer.memoryStorage(); // Store image as Buffer in memory
const upload = multer({ storage: storage });

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true, 
    handler: (req, res) => {
        return res.status(429).json({ error: "Too many login attempts. Please try again later." });
    }
});

const resetLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 5, 
    standardHeaders: true,
    legacyHeaders: false,
});

//routing path
//Register || post method
router.post('/userRegister',userRegisterController )

//redister shop
router.post('/shopregister',upload.single('logo'),shopRegisterController )

//login || post
router.post('/userLogin',loginLimiter, userLoginController )

// Route to get all shops
router.get('/shops', getAllShopsController );

//test routes
router.get('/test',requireSignIn,isAdmin,testcontroller)

//update user profile
router.put('/updateUserProfile',requireSignIn,updateUserProfileController )

//update shop profile
router.put('/updateShopProfile',requireSignIn,updateShopProfileController )

//delete user profile
router.delete('/deleteUserProfile',requireSignIn,deleteUserProfileController )

//delete shop
router.delete('/deleteShopProfile',requireSignIn,deleteShopProfileController )

// Route to get all shops
router.get('/users', getAllUsersController );

// //forgot password
// router.post('/forgot-password',forgotPasswordController )

// secure password reset flow (replaces /forgot-password) ***
router.post('/auth/reset/request', resetLimiter, requestPasswordReset);
router.post('/auth/reset/perform', resetLimiter, performPasswordReset);

//get shop count
router.get('/get-shopCount',getTotalShopCountController )

//get user count
router.get("/get-userCount",getTotalUserCountController )

router.get('/get-userGrowthData', getUserGrowthController );

//get shop increament by time
router.get('/get-shopGrowthData', getShopGrowthController );

//get shop count by category
router.get('/get-shopCountByCategory', getShopCountByCategoryController );

router.get('/logo/:pid', logoController );


//google login
router.get("/google", passport.authenticate("google",{ scope: ["profile", "email"]}));

router.get('/google/callback', passport.authenticate( "google", {
        // successRedirect: process.env.CLIENT_URL,
        failureRedirect: "/login/failed",
    }),
    (req,res) => {
        req.user.role = 0;
        req.user.email = req.user.emails[0].value;
        req.user.fullname = req.user.displayName;
        req.user.photo = req.user.photos[0].value;
        console.log(req.user);
        const token = jwt.sign({_id: req.user._id, role: req.user.role},
            process.env.JWT_SECRET, 
            {expiresIn: "7d"}
        );
        // console.log("token -> ", token)
        // console.log("Google login success, user:", req.user);
        res.redirect(`${process.env.CLIENT_URL}/login?token=${token}&user=${encodeURIComponent(
            JSON.stringify(req.user)
        )}`)
        // res.redirect(
        //     `${process.env.CLIENT_URL}/login?token=${token}&email=${req.user.emails[0].value}&name=${encodeURIComponent(req.user.displayName)}`
        // );

    //     res.json({
    //         token,
    //         role: req.user.role,
    //         user: req.user,
    // });

    }
)

router.get("/login/failed", (req,res) => {
    res.status(401).json({
        error: true,
        message: "Log in Failed"
    })
})

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect(process.env.CLIENT_URL);
});

//existing user
router.get("/login/success", (req, res) => {
    console.log('first')
    if (req.user) {
        const userWithRole = {
            ...req.user, 
            role: 0
        };
        console.log('awa1')
        console.log(userWithRole);

        res.status(200).json({
            error:false,
            message: "Successfullty Loged In",
            user: userWithRole,
        })
    } else {
       res.status(403).send({
        success: false,
        message: "Login Failed",
       })
    }
})


export default router