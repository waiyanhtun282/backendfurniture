import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

export const addProductToFavourite = async (userId : number , prdouctId : number) =>{
    return await prisma.user.update({
        where: { id: userId },
        data: {
            products: {
                connect: { id: prdouctId }
            }
        }   
    })

}
export const removeProductFromFavourite = async (
  userId: number,
  prdouctId: number
) => {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        products: {
          disconnect: { id: prdouctId },
        },
      },
    });
};