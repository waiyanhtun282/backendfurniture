import { PrismaClient, Prisma } from "./generated/prisma";
import * as bcrypt from "bcrypt"; // Import bcryptjs for password hashi
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
// const userData: Prisma.UserCreateInput[] = [
//   {
//     phone: "778661260",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661261",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661262",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661263",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661264",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661265",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
//   {
//     phone: "778661266",
//     password: "",
//     randomToken: "sfwfx23rbkxg982ntxf87",
//   },
// ];

function createRandomUser() {
  return {
    phone: faker.phone.number({ style: "international" }),
    password: "",
    randomToken: faker.internet.jwt(),
  };
}

const userData = faker.helpers.multiple(createRandomUser, {
  count: 7,
});
async function main() {
  console.log(`Start seeding ...`);
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash("12345678", salt);

  for (const u of userData) {
    u.password = password;
    await prisma.user.create({
      data: u,
    });
  }
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
