import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js";                    
const registerUser = asyncHandler( async (req, res) => {
    //get user detailws from frontend
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

export {registerUser}