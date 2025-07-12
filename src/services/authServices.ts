import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

export const getUserByPhone = async (phone: string) => {
  return await prisma.user.findUnique({
    where: { phone },
  });
};

export const createOTP = async (otpData: any) => {
  return await prisma.otp.create({
    data: otpData,
  });
};

export const getOtpByPhone = async (phone: string) => {
  return await prisma.otp.findUnique({
    where: { phone },
  });
};

export const updateOTP = async (id:number,otpData: any) => {
  return await prisma.otp.update({
    where:{id},
    data: otpData,
  });
};
