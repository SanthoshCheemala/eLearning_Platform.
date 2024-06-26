import { app } from "./app";
import { ConnectDB } from './db';
import {v2 as cloudinary} from 'cloudinary'
require("dotenv").config();

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_SECRET_KEY
})

app.listen(process.env.PORT,()=>{
    console.log(`server is coneected to the post ${process.env.PORT}`);
    ConnectDB();
})