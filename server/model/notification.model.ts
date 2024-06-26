import mongoose,{Document,Schema,Model} from "mongoose";

export interface INotification{
    title:string;
    message:string;
    status:string;
    userId:string
}

const notificationSchema = new mongoose.Schema<INotification>({
    title:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    }
},{timestamps:true});

const NotificationModel:Model<INotification> = mongoose.model('Notification',notificationSchema);

export default NotificationModel;