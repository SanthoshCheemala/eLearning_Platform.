import express from "express";
import { autherizeRole, isAuthencated } from "../middleware/auth";
import { CreateOrder, getAllOrders } from "../controllers/order.controller";

const orderRouter = express.Router();

orderRouter.post('order-course',isAuthencated,CreateOrder);

orderRouter.get('get-all-orders',isAuthencated,autherizeRole("admin"),getAllOrders)

export default orderRouter;