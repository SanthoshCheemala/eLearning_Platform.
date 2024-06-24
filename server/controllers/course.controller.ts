import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../middleware/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import cloudinary from 'cloudinary';
import { createCourse, getAllCourseService } from "../services/course.service";
import CourseModel,{ICourse, IReview} from "../model/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs"
import path from "path";
import { sendMail } from "../utils/sendMail";
import NotificationModel from "../model/notification.model";


//upload Course 

export const uploadCourse = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const data = req.body
        const thumbnail = data.thumbnail
        if(thumbnail){
            const mycloud = await cloudinary.v2.uploader.upload(thumbnail,{
                folder:"courses",

            })
            data.thumbnail = {
                public_id:mycloud.public_id,
                url:mycloud.url
            }
        }
        createCourse(data,res,next);
    } catch (error:any) {
        return next(new ErrorHandler(error.message,500))
    }
})

//edit course 

export const editCourse = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const data = req.body;
        const courseId = req.params;
        const course =await CourseModel.findById(courseId)
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            if (course && course.thumbnail) { 
                const thumbnail_id = (course.thumbnail as { public_id: string }).public_id;
                await cloudinary.v2.uploader.destroy(thumbnail_id);
            }
            const mycloud = await cloudinary.v2.uploader.upload(thumbnail,{
                folder:"courses",
            })
            data.thumbnail = {
                public_id:mycloud.public_id,
                url:mycloud.url
            }
        }
        const updatedCourse = await CourseModel.findByIdAndUpdate(courseId,{
            $set:data
        },{
            new:true
        })
        res.status(201).json({
            success:true,
            updatedCourse
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

//get course without purchasing
export const getsingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links"
        );
        await redis.set(courseId, JSON.stringify(course),'EX',604800); // 7days
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get all course without purchasing

export const getAllCourses = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const isCacheExist = await redis.get("allCourses")
        if(isCacheExist){
            const courses = JSON.parse(isCacheExist)
            res.status(200).json({
                success:true,
                courses
            })
        } else {
            const courses = await CourseModel.find().select("-courseData.videourl -courseData.suggestions -courseData.questions -courseData.links")
            await redis.set("allCourses",JSON.stringify(courses))
            res.status(200).json({
                success:true,
                courses
            })
        }
    }  catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

//get course content  - only for valid user

export const getCourseByUser = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const coursesList = req.user?.courses
        const courseID = req.params.id
        const isCourseExist = coursesList?.find((course:any)=>course.to_string() === courseID);
        if(!isCourseExist){
            return next(new ErrorHandler("Your not eligible to access this course",404))
        }
        const course = await CourseModel.findById(courseID);
        const content = course?.courseData
        res.status(200).json({
            success:true,
            content
        })
    }catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

//add questions in course

interface IQuestionData{
    question:string;
    courseId:string;
    contentId:string;
}

export const addQuestion = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {question,courseId,contentId}: IQuestionData = req.body
        const course = await CourseModel.findById(courseId)

        if(!mongoose.Types.ObjectId.isValid(contentId)){
            return next(new ErrorHandler("Invalid ContentId",400))
        }

        const content = course?.courseData?.find((item:any)=>item._id.equals(contentId));
        if(!content){
            return next(new ErrorHandler("Invalid contentId",400))
        }
        // create question Object
        const newQuestion = {
            user:req.user,
            question,
            questionReplies:[]
        }
        await NotificationModel.create({
            user:req.user?._id,
            title:"New Question Received",
            message:`you have a new Question in ${content?.title}` 
        })
        content.questions.push(newQuestion);

        course?.save
        res.status(200).json({
            success:true,
        })
    }catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


//add answering question
interface IAddAnswer{
    answer:string;
    courseId:string;
    contentId:string;
    questionId:string
}

export const addAnswer = CatchAsyncErrors(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const {answer,courseId,contentId,questionId} : IAddAnswer = req.body
        const course = await CourseModel.findById(courseId)
        if(mongoose.Types.ObjectId.isValid(contentId)){
            return next(new ErrorHandler("Invalid contentId",400))
        }
        const content = course?.courseData?.find((item:any)=>item._id.equals(contentId));
        if(!content){
            return next(new ErrorHandler("Invalid contentId",400))
        }
        const question = content.questions.find((item:any)=>item._id.equals(questionId))
        if(!question){
            return next(new ErrorHandler("Invalid questionId",400))
        }
        //Answer Object
        const answerObject = {
            user:req.user,
            answer,
        }
        await NotificationModel.create({
            user:req.user?._id,
            title:"New Question Reply Received",
            message:`you have a new Question in ${content?.title}` 
        })
        question.questionReplies.push(answerObject)
        course?.save();
        if(question.user._id === req.user?._id){

        } else {
            const data = {
                name:question.user.name,
                title:content.title
            }
            const html = await ejs.renderFile(
                path.join(__dirname,"../mails/question-reply.ejs")
            )
            try {
                await sendMail({
                    email:question.user.email,
                    subject:"Question Reply",
                    template:"question-reply.ejs",
                    data
                })
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 500));
            }
        }
        res.status(200).json({
            success:true
        })
    }catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


//add review in course

interface IReviewData{
    rating:number;
    comment:string;
}

export const AddReview  = CatchAsyncErrors(async (req:Request,res:Response,next:NextFunction)=>{
    try {
        const userCourseList = req.user?.courses
        const courseId = req.params.id

        const courseExists = userCourseList?.some((course:any)=>course._id.toString() === courseId)
        if(!courseExists){
            return next(new ErrorHandler("Your not eligible for this course",404))
        }
        const course = await CourseModel.findById(courseId)
        const {rating,comment}:IReviewData = req.body
        const NewReview:any = {
            user:req?.user,
            rating,
            comment,
        }
        course?.reviews.push(NewReview)
        let avg = 0;
        course?.reviews.forEach((rev:any)=>{
            avg += rev
        })
        if(course){
        course.ratings = avg / course.reviews.length
        }
        await course?.save();
        const notifications = {
            title:"New Review Received",
            message:`${req.user?.name} has given a review in ${course?.name}`
        }
        res.status(200).json({
            success:true,
            course
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// add reply in review
interface IAddReviewData{
    comment:string;
    courseId:string;
    reviewId:string;
}

export const  AddReply = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const  { comment,courseId,reviewId } : IAddReviewData = req.body
        const course = await CourseModel.findById(courseId)
        if(!course){
            return next(new ErrorHandler("Invalid Course_Id",400))
        }
        const review = course.reviews.find((item:any)=>item._id.equals(reviewId));
        if(!review){
            return next(new ErrorHandler("Review Not found",404))
        }
        const NewReply:any = {
            user:req.user,
            comment
        }
        review?.commentReplies?.push(NewReply)
        course.save();
        res.status(200).json({
            success:true,
            course
        })   
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }

})


export const getAllcourses = CatchAsyncErrors(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        getAllCourseService(res);
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 401));
      }
    }
  );


export const DeleteCourse = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
try {
    const {id} = req.body;
    const course = await CourseModel.findById(id);
    if(!course){
        return next(new ErrorHandler("Course Not Found",404))
    }
    await course.deleteOne({id})
    redis.del(id)
    res.status(201).json({
    success:true,
    course
    })
} catch (err: any) {
    return next(new ErrorHandler(err.message, 401));
}
})