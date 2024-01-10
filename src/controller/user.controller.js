import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCloudinar } from "../utils/cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";
import jwt from "jsonwebtoken";


// creating method for generating acess and refresh token 

const generateAccessAndRefreshToken = async (userId) => {
    try {
        
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken =  await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
        return {accessToken, refreshToken}
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong")
        
    }
    
}
const registerUser = asyncHandler( async (req, res) => {
   
    const [userName,email,fullName,password] = [req.body.userName,req.body.email,req.body.fullName,req.body.password];
    if([userName,email,fullName,password].includes('')){
        throw new ApiError(400,"All fields are required")
    }

    const userExists = await User.findOne({ 
        $or:[
            {userName},
            {email}
        ]
    });
    // return res.status(201).json(
    //     new ApiRes(201, "User created successfully---file path", userExists)
    //    )
    
    if(userExists){
        throw new ApiError(400,"User already exists")
    }
    const avtarLocalpath = req.files?.avatar[0]?.path;
    const coverImageLocalpath = req.files?.coverImage[0]?.path;

    if(!avtarLocalpath){
        throw new ApiError(400,"Please upload avatar");
    }
   
    const avtar = await uploadCloudinar(avtarLocalpath);
    const coverImage = await uploadCloudinar(coverImageLocalpath);
  
    if(!avtar){
        throw new ApiError(400,"Please upload avatar 2");
    }

    const userCreated = await User.create({
        userName,
        fullName,
        password,
        email,
        avatar: avtar.url,
        coverImage: coverImage?.url || "",
    });

   const userSuccess = await User.findById(userCreated._id).select(
    "-refreshToken -watchHistory"
   )

   if(!userSuccess){
    throw new ApiError(400,"User not created")
   }
     return res.status(201).json(
     new ApiRes(201, "User created successfully", userSuccess)
    )

    })
    
const loginUser = asyncHandler( async (req, res) => {
    const [userName,email,password]= [req.body.userName,req.body.email,req.body.password];
   
    // console.log(req);
    // return res.status(201).json(
    //     new ApiRes(201, "User login id pass inter :-->", [userName,email,password])
    //    )

    if(!userName || !email ){
       throw new ApiError(400,"userName or email is required"); 
    }

    const user = await User.findOne({
        $or:[
            {userName},
            {email}
        ]
     })
    if(!user){
        throw new ApiError(402,"User not found");
    }
    const passValidation = await user.isPasswordMatch(password);

    if(!passValidation){
        throw new ApiError(401,"Password not matched");
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);  

    const logedInUser = await User.findById(user._id).select(
        "-refreshToken -password "
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
      new ApiRes(200, 
        "User logged in successfully",
        {
          user: logedInUser,accessToken,refreshToken
        }   
       )
    )

    
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
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
    
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
        new ApiRes(200, "User logged out successfully",{})
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const inComingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    if(!inComingRefreshToken){
        throw new ApiError(401, "Unauthorized")
    }

    const decodedToken = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decodedToken){
        throw new ApiError(401, "invalied refresh token")
    }

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401, "user not found invalied token")
    }

    if(refreshToken !== user.refreshToken){
        throw new ApiError(401, "Refresh token is expired are invalid")
    }   

    const [accessToken, refreshToken] = await generateAccessAndRefreshToken(user._id);
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options).json(
        new ApiRes(200, "Access token refreshed successfully", {accessToken, refreshToken})
    )
})

const updatePassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user._id);
    const passValidation = await user.isPasswordMatch(oldPassword);
        if(!passValidation){
        throw new ApiError(401, "old password not matched")
    }
    user.password = newPassword;
    await user.save();
    console.log(req.user,"hello i am conntection how are you---------------------------->",user);
    return res.status(200).json(
        new ApiRes(200, "Password updated successfully")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res.status(200).json(
        new ApiRes(200, "Current user", req.user)   
    )
})

const updateAcount = asyncHandler( async (req, res) => {
    const { fullName, email } = req.body;
    if(!fullName || !email){
        throw new ApiError(400, "fullName or email is required")
    }
    // console.log("hello i am rquest -->",req)
    const user =await User.findByIdAndUpdate(req.user._id, {
        $set:{
            fullName,
            email
        }
    
    }, {
        new: true
    }).select("-refreshToken -password");

    return res.status(200).json(
        new ApiRes(200, "User updated successfully", user)
        
    )

})

const updateAvatar = asyncHandler( async (req, res) => {
    const localAvatar = req.file?.path;
    if(!localAvatar){
        throw new ApiError(400, "Please upload avatar")
    }
    const avatar = await uploadCloudinar(localAvatar);
    if(!avatar.url){
        throw new ApiError(400,"Something went wrong during uploading avatar")
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url
        }
    },
    {
        new: true
    }).select("-refreshToken -password");

    if(!user){
        throw new ApiError(400, "User not found during uloading avatar")
    }
    return res.status(200).json(
        new ApiRes(200, "Avatar updated successfully",avatar)
    )
    
})

const getUserProfile = asyncHandler( async (req, res) => {
    const userName = req.params;
    if(!userName){
        throw new ApiError(400, "User name is required")
    }
    const userProfile =await User.aggregate([
        {
            $match:{
                userName: userName
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
            
        },
        {
             $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribed"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedCount: {
                    $size: "$subscribed"
                },
                isSubscribed: {
                    $con:{
                        $if : {
                            $in: [req.user?._id,
                                "$subscribers._id",
                            ]
                        },
                        $then: true,
                        $else: false
                    }
                }
                
            }
        },
        {
            $project:{
               fullName: 1,
               email: 1,
               avatar: 1,
               subscribersCount: 1,
               subscribedCount: 1,
               isSubscribed: 1,
                      
            }
        }
        
    ])

    if(getUserProfile?.length === 0){
        throw new ApiError(400, "User not found")
    }
  
    return res.status(200).json(
        new ApiRes(200, "User profile", userName)
    )
})

const getUserWachHistory = asyncHandler( async (req, res) => {
     
    const wachHistory = await User.aggregate([
        {
            $match:{
                userName: req.user.userName
            }
        },
        {
            lookup:{
                from: "videos",
                localField: "wachHistory",
                foreignField: "user",
                as: "wachHistory",
                pipeline: [
                    {
                        lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project:{
                                        fullName: 1,
                                        avatar: 1,
                                        userName: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ] 
            }
        }
    ])

    return res.status(200).json(
        new ApiRes(200, "User watch history", wachHistory)
    )
})    
const allUser = asyncHandler( async (req, res) => {

    const users = await User.find().select("-refreshToken -password");
    return res.status(200).json(
        new ApiRes(200, "All users", users)
    )
})
export {
    registerUser, 
    loginUser, 
    logoutUser,
    refreshAccessToken, 
    allUser,
    updatePassword, 
    getCurrentUser, 
    updateAcount,
    updateAvatar,
    getUserProfile,
    getUserWachHistory
}