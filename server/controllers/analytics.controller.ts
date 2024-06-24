import { Request,Response,NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import ErrorHandler from "../middleware/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.genarator";
import { UserModel } from "../model/userModel";
import CourseModel from "../model/course.model";
import OrderModel from "../model/order.model";


// get users anayltics -- admin

export const getUserAnalytics = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const UserAnalytics = await generateLast12MonthsData(UserModel)
        res.status(201).json({
            success:true,
            UserAnalytics
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})



// get courses anayltics -- admin

export const getCourseAnalytics = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const CourseAnalytics = await generateLast12MonthsData(CourseModel)
        res.status(201).json({
            success:true,
            CourseAnalytics
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})


// get order anayltics -- admin

export const getOrderAnalytics = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const OrderAnalytics = await generateLast12MonthsData(OrderModel)
        res.status(201).json({
            success:true,
            OrderAnalytics
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})