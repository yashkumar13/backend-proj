// require('dotenv').config({path: './env'});

import dotenv from 'dotenv';
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import app from './app.js';

dotenv.config({
    path: './env'
})
connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000 , () => {
        console.log(`Listening at port: ${process.env.PORT}`)
    });
})
.catch((error) =>{
    console.log("MONGO db connection Failed: ", error);
})























// import express from "express";
// const app = express();
// ( async () =>{
//     try{
//         mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error", (error)=>{
//             console.log("error: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () =>{
//             console.log(`app running on port ${process.env.PORT}`)
//         })

//     }catch(error){
//         console.error("ERROR: ", error);
//         throw error
//     }
// })()