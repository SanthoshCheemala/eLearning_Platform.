import { Request, Response, NextFunction } from "express";
import { IUser, UserModel } from "../model/userModel";
import ErrorHandler from "../middleware/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { sendMail } from "../utils/sendMail";
import Schema from "mongoose";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService, getUserById, updateUserRoleService } from "../services/user.service";
import cloudinary from "cloudinary"

require("dotenv").config();

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const regsitrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isEmailExist = await UserModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("email already exist", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const ActivationToken = CreateActivationCode(user);
      const ActivationCode = ActivationToken.activationCode;

      const data = { user: { name: user.name }, ActivationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );
      try {
        await sendMail({
          email: user.email,
          subject: "Active Your Account",
          template: "activation-mail",
          data: data,
        });
        res.status(201).json({
          success: true,
          message: `Please Check Your email ${user.email} to active account`,
          ActivationCode: ActivationToken.token,
        });
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
interface IActivationToken {
  token: string;
  activationCode: string;
}

export const CreateActivationCode = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}
export const activeuser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid acitvation Code", 400));
      }

      const { name, email, password } = newUser.user;
      const emailExist = await UserModel.findOne({ email });

      if (emailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }
      await UserModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//login user

interface LoginBody {
  email: string;
  password: string;
}

export const LoginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginBody;
      if (!email || !password) {
        return next(new ErrorHandler("please enter email or password", 401));
      }

      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      const ispasswordMatch = await user.comparedPassword(password);
      if (!ispasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      sendToken(user, 200, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
    }
  }
);

//logout User
export const LogoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const UserId = req.user?._id
      
      redis.del(UserId)
      res.status(200).json({
        success: true,
        message: "Logged out Successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
    }
  }
);

//New Access Token

export const updateAccessToken = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const refresh_token = req.cookies.refresh_token as string
        const decode = jwt.verify(refresh_token,process.env.REFRESH_TOKEN as string) as JwtPayload
        if(!decode) {
            return next(new ErrorHandler("Invalid Refresh Token",400))
        }

        const session = await redis.get(decode.id as string) // Await the promise to resolve
        
        if(!session){
            return next(new ErrorHandler("Please Login to access the resources",400))
        }
        const user = JSON.parse(session) // Parse the result as JSON
        const AccessToken = jwt.sign({id:user._id},process.env.ACCESS_TOKEN as string,{
            expiresIn:'5m'
        })
        const RefreshToken = jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
            expiresIn:'3d'
        })
        req.user = user
        res.cookie("access_token",AccessToken,accessTokenOptions);
        res.cookie("refresh_token",RefreshToken,refreshTokenOptions);
        await redis.set(user._id, JSON.stringify(user) , "EX" , 604800 );
        res.status(200).json({
            success:true,
            AccessToken
        })

    } catch (err: any) {
        return next(new ErrorHandler(err.message, 401));
    }
})

//get user info

export const getUserInfo = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const userId = req.user?._id
        getUserById(userId,res);
    } catch (err: any) {
        return next(new ErrorHandler(err.message, 401));
    }
})

//socialAuth
interface ISocialBody{
    name:string;
    email:string;
    avatar:string;
}

export const socialAuth = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {name,email,avatar} = req.body as ISocialBody
        const user = await UserModel.findOne({email})
        if(!user){
            const newUser = await UserModel.create({
                name,
                email,
                avatar,
            })
            sendToken(newUser,201,res)
        } else {
            sendToken(user,201,res)
        }
    }  catch (err: any) {
        return next(new ErrorHandler(err.message, 401));
    }
})

//update user info
interface IUpdateUserInfo{
  name?:string;
  email?:string
}


export const UpdateUserInfo = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {name,email} = req.body as IUpdateUserInfo;
    const userId = req.user?._id;
    const user = await UserModel.findById(userId)
    if(user){
    if(email && name){
      const isEmailexist =await UserModel.findOne({email})
      if(isEmailexist){
        return next(new ErrorHandler("Email already exist",400))
      }
      user.email = email;
    }
    if(name && email){
      user.name = name
    }
    await redis.set(userId,JSON.stringify(user))
    user.save();
    res.status(200).json({
      success:true,
      user,
    })
  }
    }catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
  }
})


//update Password
interface IUpdatePassword{
  oldPassword:string,
  newPassword:string
}

export const UpdatePassword = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {oldPassword,newPassword} = req.body as IUpdatePassword
    if(!oldPassword || !newPassword){
      return next(new ErrorHandler("Please Enter Your Password",400))
    }
    const UserId = req.user?._id
    const user = await UserModel.findById(UserId).select("+password");

    if(user?.password === undefined){
      return next(new ErrorHandler("Invalid user",400))
    }
    const isPasswordMatch =await user?.comparedPassword(oldPassword);
    if(!isPasswordMatch){
      return next(new ErrorHandler("wrong old password,please try again",400))
    }
    user.password = newPassword;
    user.save();
    await redis.set(UserId,JSON.stringify(user));
    res.status(201).json({
        success:true,
        message:"Updated Successfully"
    })
    }catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
  }
})


//update Profile picture 

interface IAvatar{
  avatar:string
}

export const UpdateUserPicture = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const avatar = req.body as IAvatar
    const UserId = req.user?._id;
    const user =await UserModel.findById(UserId);
    if(!avatar){
      return next(new ErrorHandler("please upload profile image",400));
    }
    if(user?.avatar.public_id){
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }
    const mycloud = await cloudinary.v2.uploader.upload(avatar.avatar,{
      folder:"avatars",
      width:150
    });
    if(user){
    user.avatar = {
      public_id:mycloud.public_id,
      url:mycloud.secure_url
    }
  }
  user?.save();
  await redis.set(UserId,JSON.stringify(user))
  res.status(200).json({
    success:true,
    message:"profile Picutre is successfully uploaded"
  })
  
  } catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
  }
})


//get All Users -- only for admin

export const getAllUsers = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 401));
    }
  }
);

//update Role of the user -- admin

export const UpdateUserRole = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {id,role}  = req.body
    updateUserRoleService(id,role,res,next)
  } catch (err: any) {
    return next(new ErrorHandler(err.message, 401));
  }
})

//delete User --  admin

export const DeleteUser = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const {id} = req.body;
    const user = await UserModel.findById(id);
    if(!user){
      return next("User Not Found",404)
    }
    await user.deleteOne({id})
    redis.del(id)
    res.status(201).json({
      success:true,
      user
    })
  } catch (err: any) {
    return next(new ErrorHandler(err.message, 401));
  }
})