import { Request,Response,NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import ErrorHandler from "../middleware/ErrorHandler";
import ejs from "ejs"
import { IOrder } from "../model/order.model";
import { UserModel } from "../model/userModel";
import CourseModel from "../model/course.model";
import { getAllOrdersServices, newOrder } from "../services/order.service";
import path from "path";
import { sendMail } from "../utils/sendMail";
import NotificationModel from '../model/notification.model';
// oder Course 

export const CreateOrder = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {courseId,payment_info} = req.body as IOrder
        const user = await UserModel.findById(req.user?._id)
        const IsCourseExist = user?.courses.some((course:any)=>course._id.toString() === courseId);
        if(IsCourseExist){
            return next(new ErrorHandler("your are already purchased course",400))
        }
        const course = await CourseModel.findById(courseId)
        if(!course){
            return next(new ErrorHandler("Course Not found",404))
        }
        const data:any = {
            courseId:course._id,
            userId:user?._id,
            payment_info,
        }
        const mailData = {
            order:{
                _id:course._id.toString().slice(0,6),
                name:course.name,
                price:course.price,
                data:new Date().toLocaleDateString('en-US',{year:"numeric",month:"long",day:"numeric"})
            }
        }
        const html = await ejs.renderFile(path.join(__dirname,'../mails/order-confirmation.ejs'),{order:mailData})
        try {
            if(user){
                await sendMail({
                    email:user.email,
                    subject:"Order Confirmation",
                    template:"order-confirmation.ejs",
                    data:mailData
                })
            }
        } catch (error:any) {
            return next(new ErrorHandler(error.message,500))
        }
        user?.courses.push(course._id);
        user?.save();
        await NotificationModel.create({
            user:user?._id,
            title:"New Order",
            message:`you have a new order from ${course.name}`
        })
    
        course.purchased?course.purchased += 1:course.purchased;
        await course.save();
        newOrder(data,res,next)
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
    }
})


export const getAllOrders = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
      getAllOrdersServices(res)
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
  }
  })