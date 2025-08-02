import { Worker } from "bullmq";
import { Redis } from "ioredis";
import path from "path";
import sharp from "sharp";


const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  maxRetriesPerRequest:null
});


const imageWorker = new Worker("imageQueue", async (job) =>{
    const  { filePath,fileName,width,height,quality } =job.data;
    const optimizedImagePath =path.join(
    __dirname, "../../..","/uploads/optimize",fileName
    );

    await sharp(filePath)
    .resize(width,height)
    .webp({quality:quality})
    .toFile(optimizedImagePath)
}, { connection });

imageWorker.on("completed", (job) =>{
 console.log(`Job Completed with result ${job.id}`);
});

imageWorker.on("failed", (job ,err) =>{
 console.log(`Job ${job!.id} Fail with  ${err.message}`);

})