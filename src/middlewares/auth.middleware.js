import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";


export const jwtVerify = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers("Authorization").replace("Bearer ", "");
    if(!token){
        throw new ApiError(401, "Unauthorized")
    }
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401, "Unauthorized")
    }
    req.user = user
    next()
})