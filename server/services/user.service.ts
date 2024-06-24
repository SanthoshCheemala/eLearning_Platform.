import {NextFunction, Response, response} from 'express';
import { UserModel } from '../model/userModel';
import { redis } from '../utils/redis';
import { CatchAsyncErrors } from '../middleware/CatchAsyncErrors';
import ErrorHandler from '../middleware/ErrorHandler';


//get user by id

export const getUserById = async(id:string,res:Response) => {
    console.log(id);
    
    const UserJson =await redis.get(id);
    if(UserJson){
        const User = JSON.parse(UserJson)
        res.status(200).json({
            success:true,
            User,
        });
    }

}


//Get All Users

export const getAllUsersService = async(res:Response)=>{
        const AllUsers = UserModel.find().sort({createdAt:-1});
        res.status(201).json({
            success:true,
            AllUsers
        })
}

export const updateUserRoleService = async(id:string,role:string,res:Response,next:NextFunction)=>{
    const user =await UserModel.findById(id)
    if(!user){
        return next(new ErrorHandler("User Not found",500))
    }
    user.role = role;
    user.save()
    redis.set(user._id,JSON.stringify(user))
    res.status(201).json({
        success:true,
        user
    })
}