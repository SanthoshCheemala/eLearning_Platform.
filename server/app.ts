require("dotenv").config();
import cookieParser from "cookie-parser";
import  express,{NextFunction,Request,Response} from "express";
import cors from "cors"
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./router/user.route";
import courseRouter from "./router/course.route";
import orderRouter from "./router/order.route";
import notificationRouter from "./router/notification.route";
import anaylticsRouter from "./router/analytics..route";
import layoutRouter from "./router/layout.route";
export const app = express();

//body-parser
app.use(express.json({limit:"50mb"}))

//cookie-parser
app.use(cookieParser())

//cors=>cross origin platform
app.use(cors({
    origin:process.env.ORIGIN
}))

//routes
app.use('/api/v1',userRouter,orderRouter,courseRouter,notificationRouter,anaylticsRouter,layoutRouter)

//testing api
app.get('/test',(req:Request,res:Response,next:NextFunction)=>{
    res.status(200).json({
        success:true,
        message:"API is working"
    })
})

//unknow routes
app.all("*",(req:Request,res:Response,next:NextFunction)=>{
    const err = new Error(`Route ${req.originalUrl} not Found`) as any;
    err.statusCode = 404,
    next(err)
})

app.use(ErrorMiddleware);
