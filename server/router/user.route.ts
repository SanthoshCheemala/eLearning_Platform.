import  express from "express";
import { DeleteUser, LoginUser, LogoutUser, UpdatePassword, UpdateUserInfo, UpdateUserPicture, UpdateUserRole, activeuser, getAllUsers, getUserInfo, regsitrationUser, socialAuth, updateAccessToken } from "../controllers/user.controller";
import { autherizeRole, isAuthencated } from "../middleware/auth";
import { DeleteCourse } from "../controllers/course.controller";


const userRouter  = express.Router();

userRouter.post('/registration',regsitrationUser);

userRouter.post('/active-user',activeuser)

userRouter.post('/login-user',LoginUser)

userRouter.post('/social-auth',socialAuth);

userRouter.get('/logout-user',isAuthencated,LogoutUser);

userRouter.get('/refresh',updateAccessToken);

userRouter.get('/me',isAuthencated,getUserInfo);

userRouter.get('get-all-users',isAuthencated,autherizeRole("admin"),getAllUsers)

userRouter.put('/update-user',isAuthencated,UpdateUserInfo)

userRouter.put('/update-password',isAuthencated,UpdatePassword);

userRouter.put('/update-avatar',isAuthencated,UpdateUserPicture);

userRouter.put('/update-user-role',isAuthencated,autherizeRole('admin'),UpdateUserRole)

userRouter.delete('delete-user',isAuthencated,autherizeRole("admin"),DeleteUser)
export default userRouter;