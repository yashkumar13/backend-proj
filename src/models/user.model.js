import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    
    username:{
        type : String,
        unique: true,
        lowercase: true,
        required : true,
        trim: true,
        index: true
    },
    email:{
        type : String,
        unique: true,
        lowercase: true,
        required : true,
    },
    fullname:{
        type : String,
        required : true,
        index: true,
        trim: true,
    },
    avatar:{
        type: String, // cloudinary url
        required : true,

    },
    CoverImage: {
        type: String,

    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password:{
        type: String,
        required: [true, 'Password is required.']
    },
    refreshToken: {
        type: String,
    },

}, {timestamps: true}) 

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function
(password){
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)