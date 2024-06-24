import { NextFunction, Response } from 'express';
import { CatchAsyncErrors } from '../middleware/CatchAsyncErrors';
import OrderModel from '../model/order.model';

export const newOrder = CatchAsyncErrors(
    async (data: any, res: Response, next: NextFunction) => {
      const order = await OrderModel.create(data);
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    }
  );

export const getAllOrdersServices = async(res:Response)=>{
    const AllOrders = OrderModel.find().sort({createdAt:-1});
    res.status(201).json({
        success:true,
        AllOrders
    })
}