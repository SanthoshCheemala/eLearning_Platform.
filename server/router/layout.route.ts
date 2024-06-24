import  express  from "express";
import { autherizeRole, isAuthencated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutType } from "../controllers/layout.controller";

const layoutRouter = express.Router();

layoutRouter.post("/create-layout",isAuthencated,autherizeRole('amdin'),createLayout)

layoutRouter.put("/update-layout",isAuthencated,autherizeRole('amdin'),editLayout)

layoutRouter.get('/get-layout',isAuthencated,autherizeRole('admin'),getLayoutType)


export default layoutRouter;