import mongoose,{Document,Model,Schema} from "mongoose";

export interface IOrder extends Document{
    courseId:string;
    userId:string;
    payment_info:object;
}

const oderSchema = new mongoose.Schema<IOrder>({
    courseId: { // Change 'courseId' to 'courseID'
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    payment_info: {
        type: Object
    }
}, { timestamps:true })

const OrderModel:Model<IOrder> = mongoose.model('Order',oderSchema)

export default OrderModel;