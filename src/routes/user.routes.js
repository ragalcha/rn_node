import { Router } from "express";
import { allUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAcount, updatePassword, updateAvatar, getUserProfile } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(
    upload.fields([
        { name: "avatar",
         maxCount: 1 
        },
        { name: "coverImage",
         maxCount: 1 
        },
    ]),
    registerUser)

router.route("/login").post(loginUser)
router.route("/all").get(allUser)

//secute router 

router.route("/logout").post(jwtVerify,logoutUser)
router.route("/update").patch(jwtVerify,updateAcount)
router.route("/password").patch(jwtVerify,updatePassword)
router.route("/refreshToken").get(refreshAccessToken)
router.route("/userprofile/:userName").get(jwtVerify,getUserProfile)
router.route("/update/avatar").patch(jwtVerify,upload.single("avatar"),updateAvatar)
export default router