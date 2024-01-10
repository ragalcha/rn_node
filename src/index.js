// import mongoose from "mongoose";
// require('dotenv').config();
// import { DB_NAME } from "./constants";  
import dotenv from "dotenv";
import dbConection from "./db/db.js";
import { app } from "./app.js";

dotenv.config({path: "./env"});
dbConection()
.then((ress) => {
  app.listen(process.env.PORT|| 5000, () => {
      console.log(`Server running on port ${process.env.PORT}`);
  })  
})
.catch((error) => console.log("Error: ", error));

// app.post("/", (req, res) => {
//   res.send("Hello World!");
// })





// ( async () => {
//   try {
//    await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`);
//   } catch (error) {
//     console.log("Error: ", error);
//   }
// })()