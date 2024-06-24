import express from 'express';
import { autherizeRole, isAuthencated } from '../middleware/auth';
import { getNotification, updateNotificationStatus } from '../controllers/notification.controller';
import cron from "node-cron"
import NotificationModel from '../model/notification.model';
const notificationRouter = express.Router();


notificationRouter.get('/get-all-notification',isAuthencated,autherizeRole("admin"),getNotification)


notificationRouter.put('/update-notification-status',isAuthencated,autherizeRole("admin"),updateNotificationStatus)
export default notificationRouter


//delete notification 

cron.schedule('/0 0 0 * * *',async()=>{
    const thirtydaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    await NotificationModel.find({status:"read",createdAt:{$lt:thirtydaysAgo}})
})