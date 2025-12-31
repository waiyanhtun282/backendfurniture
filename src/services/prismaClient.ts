import { Image, Post, User } from "../../generated/prisma/client";
import { PrismaClient } from "../../generated/prisma/client";

export const prisma = new PrismaClient().$extends({
  result: {
    user: {
      fullName: {
        needs: { firstName: true, lastName: true },
        compute(user:User) {
          return `${user.firstName} ${user.lastName}`;
        },
      },
    },
    post: {
      image: {
        needs: { image: true },
        compute(post:Post) {
          return "/optimize/" + post.image.split(".")[0] + ".webp";
        },
      },
      updatedAt: {
        needs: { updatedAt: true },
        compute(post:Post) {
          return post.updatedAt.toLocaleDateString("en-Us", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
      
    },
    image:{
      path:{
        needs: { path: true },
        compute(image:Image) {
          return "/optimize/" + image.path.split(".")[0] + ".webp";
        },
      }
    }
  },
});