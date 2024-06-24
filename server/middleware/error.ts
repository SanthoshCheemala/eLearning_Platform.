import { Request, Response, NextFunction } from 'express';
import ErrorHandler from "./ErrorHandler";

export const ErrorMiddleware = (err:any,req:Request,res:Response,next:NextFunction) =>{

    if (!err) {
        err = new ErrorHandler('Unknown error', 500);
    }

    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal server error'

    //wrong mongodb id error
    if(err.name === "CastError"){
        const message =  `Resource not found. Invalid: ${err.path}`
        err = new ErrorHandler(message,400);
    }

    //Dubplicate key error
    if(err.statusCode === 11000){
        const message =     `Duplicate ${Object.keys(err.keyValue)} entered`
        err = new ErrorHandler(message,400)
    }

    //wrong jwt token error
    if (err.name === "JsonWebTokenError") {
        const message = `Json web token is invalid, try again`;
        err = new ErrorHandler(message, 400);
    }

    // JWT token is expired error
    if(err.name === "TokenExpiredError"){
        const message = `Json Web Token is expired, try again`
        err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
}