import cors from "cors"
import cookieParser from "cookie-parser";
import express from 'express'
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "8kb"}))
//limit of json data
app.use(express.urlencoded({extended: true, limit:"8kb"}))
//url se jo data aata h usko encode karta h
app.use(express.static("public"))
//public assets
app.use(cookieParser())
//configuring cookie-parser


//routes import

import userRouter from "./routes/user.routes.js"

//routes declaraion
app.use("/api/v1/users", userRouter)   

//https://localhost:3000/api/v1/users/login
//https://localhost:3000/api/v1/users/register
export default app