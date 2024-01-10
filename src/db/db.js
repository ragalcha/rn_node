import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";


const dbConection = async () => {
    try {
        const mongooseConRes = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("MongoDB connected: ", mongooseConRes.connection.port);
        return "ramaiya agalcha success";
    } catch (error) {
        console.log("Error:- ", error);
        // throw error
        process.exit(1);
             
    }
}
export default dbConection