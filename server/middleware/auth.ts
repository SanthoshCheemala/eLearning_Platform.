import { Request,Response,NextFunction } from "express";
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import ErrorHandler from "./ErrorHandler";
import { CatchAsyncErrors } from "./CatchAsyncErrors";
import { UserModel } from "../model/userModel";
import { redis } from "../utils/redis";
require("dotenv").config()
//authencated user
export const isAuthencated = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    const access_token  = req.cookies.access_token;
    
    if(!access_token){
        return next(new ErrorHandler("Please Login to access the resources",400));
    }
    const decoded =jwt.verify(access_token,process.env.ACCESS_TOKEN as string) as JwtPayload
    if(!decoded){
        return next(new ErrorHandler("access token is invalid",400));
    }
    const user = await redis.get(decoded.id);
    if(!user){
        return next(new ErrorHandler("invalid User",400))
    }
    req.user = JSON.parse(user)
    next();
})

//validate user Role 

export const autherizeRole = (...roles:string[]) => {
    return ((req:Request,res:Response,next:NextFunction)=>{
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`,403))
        }
        next();
    })
}