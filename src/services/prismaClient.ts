import { PrismaClient } from "../../prisma/generated/prisma";


export const prisma = new PrismaClient().$extends({
  result: {
    user: {
      fullName: {
        needs: { firstName:true, lastName: true },
        compute(user) {
          return `${user.firstName} ${user.lastName}`
        }
      }
    },
    post: {
      image : {
        needs: { image: true },
        compute(post) {
          return "/optimize/" +post.image.split('.')[0] + '.webp'
        }
      },
      updatedAt: {
        needs : { updatedAt :true},
        compute(post) {
          return post.updatedAt.toLocaleDateString("en-Us", {
            year:"numeric",
            month:"long",
            day : "numeric"
          })
        }
      }
    },
  }
});