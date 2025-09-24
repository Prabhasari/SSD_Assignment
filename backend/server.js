import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import AuthRoutes from './routes/AuthRoute.js'
import promotionRoutes from "./routes/promotionRoute.js"
import categoryRoutes from './routes/categoryRoute.js'
import productRoutes from  './routes/productRoute.js'
import shoppingcartRoutes from './routes/shoppingcartRoute.js'
import LostAndFoundRoutes from './routes/LostAndFoundRoute.js'
import eventRoutes from './routes/eventRoute.js'
//import fileUpload from 'express-fileupload';
import sanitize from "mongo-sanitize";
import helmet from "helmet";
import { mailer } from "./helpers/Mailer.js";

import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import cors from "cors";

//configure env
dotenv.config();

//database config
connectDB();

//rest object
const app = express();

app.use(session({
    secret: "secrete",
    resave: false,
    saveUninitialized: true,
}))

// Middleware to handle file uploads
//app.use(fileUpload());

//middelwares
app.use(cors({
    origin: "http://localhost:3000",
	methods: "GET,POST,PUT,DELETE",
	credentials: true,
}))
app.use(express.json())
app.use(morgan('dev'))
app.use(helmet())
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret : process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: ["profile", "email"],
    },function (accessToken, refreshToken, profile, callback) {
        callback(null, profile) 
    })
);

passport.serializeUser((user, done ) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));



// sanitize all incoming inputs BEFORE routes
app.use((req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
});

//routes
app.use("/api/v1/userauth",AuthRoutes)
app.use("/api/v1/promotions",promotionRoutes)
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/product', productRoutes);
app.use("/api/v1/cart", shoppingcartRoutes); 
app.use("/api/v1/LostAndFound",LostAndFoundRoutes);
app.use("/api/v1/Event",eventRoutes);

// Verify SMTP once on boot (helps catch bad MAIL_* env values)
mailer.verify()
  .then(() => console.log('SMTP ready (Mailtrap Transactional Sandbox)'))
  .catch(err => console.error('SMTP error:', err.message));

// rest api
app.get("/" , (req,res) => {
    res.send({
        message: "Welcome to  Serandib Plaza",
    });
});

//Port
const PORT = process.env.PORT || 8088;

//run listen
app.listen(PORT, () => {
    console.log(`Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan.white);
});
