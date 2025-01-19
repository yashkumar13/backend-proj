import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js";                    
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong white generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists - username, email
    //check for images, check for avatar
    //upload them to cloudinary , avatar
    //create user object - create entry  in cb
    //remove password and refresh token field from response   
    //check for user creation     
    //retrun response

    const { username, fullName, email, password} = req.body
    //console.log(req.body);
    
    //  if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    //  }
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already present")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //ye multer files ka access de deta h
    //array of objects deta h (ek hi object hota h, that's why avatar[0].
    //  or usme path(key-value pair) ki value nikal kar deta h)
    
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is not uploaded on cloudinary.")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        //ye dono field hat jaengi
    )
    
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")   
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
    
})

const loginUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //username or email
    //check if user exists or not - username, email
    //check password - compare with password saved in db  
    //generate access and refresh token
    //send cookie
    //retrun response


    const { email , username , password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required.");
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    //sending cookies
      const options = {
          httpOnly: true,
          secure: true
      }// can be modified by server

    return res
    .status(200)
    .cookie("accessToken",accessToken ,options)
    .cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(
            200,{
                user: loggedInUser, accessToken, refreshToken
                //if user is trying to save tokens in local storage
            },
            "User logged in successfully"

        )
    )


})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200
            ,{}
            ,"User logged out Successfully"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFERESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"INVALID refresh token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed succesfully"
            )
        )
    } catch (error) {
        throw new ApiError(402, error?.message ||
            "Invalid REFRESH token")
    }
}) 

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}