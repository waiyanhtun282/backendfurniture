import { randomBytes } from "crypto";

export const generateOTP =() =>{
    return (randomBytes(3).toString('hex'),15)% 900000 + 100000;
} 

export const generateToken=() =>{
    return randomBytes(32).toString("hex");
    
}