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

export default app