import {Request,Response, NextFunction } from 'express';

export const  getAllUsers = async (req :Request, res :Response, next:NextFunction) => {
     res.status(200).json({message:"Get ALL Users   "});

}