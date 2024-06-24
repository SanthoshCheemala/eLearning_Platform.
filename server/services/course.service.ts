import {Response} from 'express';
import { redis } from '../utils/redis';
import { CatchAsyncErrors } from '../middleware/CatchAsyncErrors';
import CourseModel from '../model/course.model';


export const createCourse = CatchAsyncErrors(async(data:any,res:Response)=>{
    const course =await CourseModel.create(data)
    res.status(201).json({
        success:true,
        course
    })
})

export const getAllCourseService = async(res:Response)=>{
    const Courses = CourseModel.find().sort({createdAt:-1})
    res.status(201).json({
        success:true,
        Courses
    })
}