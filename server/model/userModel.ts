import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { NextFunction } from "express";
import { monitorEventLoopDelay } from "perf_hooks";
import jwt from "jsonwebtoken"
require("dotenv").config();
const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparedPassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "please enter your valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be atleast 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

//hash password before saving
UserSchema.pre<IUser>("save", async function (next: NextFunction) {
  if (!this.isModified("password")) {
    next();
  }
  const salt_round: number = parseInt(process.env.SALT_ROUND || "10");
  this.password = (await bcrypt.hash(this.password, salt_round)) as string;
  next();
});

//sign Access Token
UserSchema.methods.SignAccessToken = function (){
  return jwt.sign({id:this._id},process.env.ACCESS_TOKEN || '',{
    expiresIn:'5m'
  })
}

//dign Refresh Token
UserSchema.methods.SignRefreshToken = function (){
  return jwt.sign({id:this._id},process.env.REFRESH_TOKEN || '',{
    expiresIn:'3d'
  })
}

//Compare Password
UserSchema.methods.comparedPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const UserModel: Model<IUser> = mongoose.model("User", UserSchema);
