import { prisma } from "../../lib/prisma";

export const addProductToFavourite = async (
  userId: number,
  prdouctId: number
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      products: {
        connect: { id: prdouctId },
      },
    },
  });
};
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
