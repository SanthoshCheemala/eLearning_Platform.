import { Request,Response,NextFunction } from "express";
import { CatchAsyncErrors } from "../middleware/CatchAsyncErrors";
import ErrorHandler from "../middleware/ErrorHandler";
import cloudinary from 'cloudinary';
import LayoutModel from "../model/layout.model";


export const createLayout = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {type} = req.body
        const isTypeExist  = await LayoutModel.findOne({type})
        if(isTypeExist){
            return next(new ErrorHandler(`${type} already exist`,400))
        }
        if(type === 'Banner'){
            const {image,title,subTitle} = req.body
            const myCloud = await cloudinary.v2.uploader.upload(image,{
                folder:'Layout'
            })
            const banner = {
                image:{
                    image:myCloud.public_id,
                    url:myCloud.url
                },
                title,
                subTitle
            }
            await LayoutModel.create(banner)
        }
        if(type === 'FAQ'){
            const {faq} = req.body
            const faqItems = await Promise.all(
                faq.map(async(item:any)=>{
                    return {
                        questions:item.question,
                        answer:item.answer
                    }
                })
            );
            await LayoutModel.create({type:"FAQ",faq:faqItems})
        }
        if(type === 'Categories'){
            const {categories} = req.body
            const CategoriesItems = await Promise.all(
                categories.map(async(item:any)=>{
                    return {
                        title:item.title,
                    }
                })
            );
            await LayoutModel.create({type:'Categories',categories:CategoriesItems})
        }
        res.status(200).json({
            success:true,
            message:"Layout created Successfully"
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})

//edit Layout

export const editLayout = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {type} = req.body
        if(type === 'Banner'){
            const {image,title,subTitle} = req.body
            const bannerData:any = await LayoutModel.findOne({type:"Banner"})
            await cloudinary.v2.uploader.destroy(bannerData.image.public_id)
            const mycloud = await cloudinary.v2.uploader.upload(image,{
                folder:'Layout'
            })
            const banner = {
                image:{
                    image:mycloud.public_id,
                    url:mycloud.url
                },
                title,
                subTitle
            }
            await LayoutModel.findByIdAndUpdate(bannerData.id,{banner},{
                new:true
            })
        }
        if(type === 'FAQ'){
            const {faq} = req.body
            const faqData = await LayoutModel.findOne({type:'FAQ'})
            const faqItems = await Promise.all(
                faq.map(async(item:any)=>{
                    return {
                        questions:item.question,
                        answer:item.answer
                    }
                })
            );
            await LayoutModel.findByIdAndUpdate(faqData?.id,{type:"FAQ",faq:faqItems})
        }
        if(type === 'Categories'){
            const {categories} = req.body
            const categorieData = await LayoutModel.findOne({type:'Categories'})
            const CategoriesItems = await Promise.all(
                categories.map(async(item:any)=>{
                    return {
                        title:item.title,
                    }
                })
            );
            await LayoutModel.findByIdAndUpdate(categorieData?.id,{type:'Categories',categories:CategoriesItems})
        }
        res.status(200).json({
            success:true,
            message:"Layout Updated Successfully"
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})


//get layout by type 

export const getLayoutType = CatchAsyncErrors(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {type} = req.body
        const layout = await LayoutModel.findOne({type});
        res.status(201).json({
            success:true,
            layout
        })
    } catch (err:any) {
        return next(new ErrorHandler(err.message,500))
    }
})