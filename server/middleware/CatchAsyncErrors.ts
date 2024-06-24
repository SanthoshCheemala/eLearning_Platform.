import { Request, Response, NextFunction } from 'express';

export const CatchAsyncErrors = (theFunC: any) => (req:Request, res:Response, next:NextFunction) => {
  Promise.resolve(theFunC(req, res, next)).catch(next);
};
