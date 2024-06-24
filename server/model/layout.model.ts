import mongoose, { Schema,Model,Document } from "mongoose";

interface FaqItem extends Document{
    question: string;
    answer: string;
}

interface Category extends Document{
    title:string
}

interface BannerImage extends Document{
    public_id:string;
    url: string;
}

interface Layout extends Document{
    type:string;
    faq:FaqItem[];
    categories:Category[];
    banner:{
        image:BannerImage;
        title:string;
        subTitle:string;
    }
}

const FaqSchema = new  mongoose.Schema<FaqItem>({
    question:{
        type:String,
    },
    answer:{
        type:String,
    }
})

const CategorySchema = new mongoose.Schema<Category>({
    title:{
        type:String,
    }
})

const BannerSchema = new mongoose.Schema<BannerImage>({
    public_id:{
        type:String,
    },
    url:{
        type:String,
    },
})

const LayoutSchema = new mongoose.Schema<Layout>({
    type:{
        type:String
    },
    faq:[FaqSchema],
    categories:[CategorySchema],
    banner:{
        image:BannerSchema,
        title:{
            type:String,
        },
        subTitle:{
            type:String,
        }
    }
})

const LayoutModel:Model<Layout> = mongoose.model('Layout',LayoutSchema)

export default LayoutModel;