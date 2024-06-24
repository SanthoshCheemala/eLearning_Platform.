import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import ErrorHandler from "../middleware/ErrorHandler";
import { Request,Response,NextFunction } from "express";
import NotificationModel from "../model/notification.model";


//get all notification --admin

export const getNotification = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notificationa = await NotificationModel.find().sort({createdAt: -1});
        res.status(201).json({
            success:true,
            notificationa
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})

//update notification status --only admin
export const updateNotificationStatus = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const notification = await NotificationModel.findById(req.params.id);
        if (notification) {
            notification.status ? notification.status =  "read" : notification.status;
            await notification.save();
            const notifications = await NotificationModel.find().sort({createdAt: -1})
            res.status(201).json({
                success:true,
                notifications
            })
        }
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500));
    }
});
