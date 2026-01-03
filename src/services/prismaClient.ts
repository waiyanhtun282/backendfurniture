import { PrismaPg } from "@prisma/adapter-pg";
import { Image, Post, User,PrismaClient } from "../../generated/prisma/client";


const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({adapter}).$extends({
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