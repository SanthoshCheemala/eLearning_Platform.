import  express  from "express";
import { autherizeRole, isAuthencated } from "../middleware/auth";
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from "../controllers/analytics.controller";


const anaylticsRouter = express.Router();


anaylticsRouter.get('/get-user-anayltics',isAuthencated,autherizeRole("admin"),getUserAnalytics)

anaylticsRouter.get('/get-course-anayltics',isAuthencated,autherizeRole("admin"),getCourseAnalytics)

anaylticsRouter.get('/get-order-anayltics',isAuthencated,autherizeRole("admin"),getOrderAnalytics)

export default anaylticsRouter