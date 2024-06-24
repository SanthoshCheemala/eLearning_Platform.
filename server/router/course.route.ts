import express from "express";
import { autherizeRole, isAuthencated } from "../middleware/auth";
import {
    AddReply,
    AddReview,
    DeleteCourse,
    addAnswer,
  addQuestion,
  editCourse,
  getAllCourses,
  getCourseByUser,
  getsingleCourse,
  uploadCourse,
} from "../controllers/course.controller";

const courseRouter = express.Router();

courseRouter.get("/get-course/:id", getsingleCourse);

courseRouter.get("/get-courses-content/:id", isAuthencated, getCourseByUser);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get('get-all-courses',isAuthencated,autherizeRole("admin"),getAllCourses)

courseRouter.post(
  "/create-course",
  isAuthencated,
  autherizeRole("admin"),
  uploadCourse
);

courseRouter.post(
  "/create-course",
  isAuthencated,
  autherizeRole("admin"),
  uploadCourse
);

courseRouter.put("/add-question", isAuthencated, addQuestion);

courseRouter.put("/add-answer", isAuthencated, addAnswer);

courseRouter.put('/add-review/:id',isAuthencated,AddReview);

courseRouter.put(
  "/update-course",
  isAuthencated,
  autherizeRole("admin"),
  editCourse
);

courseRouter.put(
    "/add-review-reply",
    isAuthencated,
    autherizeRole("admin"),
    AddReply
)

courseRouter.delete('/delete-course',isAuthencated,autherizeRole('admin'),DeleteCourse)



export default courseRouter;
