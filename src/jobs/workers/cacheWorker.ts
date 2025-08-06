import { Worker } from "bullmq";
import { redis } from "../../../config/redisClient";


export const cacheWorker = new Worker(
  "cache-invalidation",
  async (job) => {
    const { pattern } = job.data;
    await invalidDataCache(pattern);
  },
  {
    connection: redis,
    concurrency: 5, // process 5jobs courrencey
  }
);

cacheWorker.on("completed", (job) => {
  console.log(`Job Completed with result ${job.id}`);
});

cacheWorker.on("failed", (job, err) => {
  console.log(`Job ${job!.id} Fail with  ${err.message}`);
});

const invalidDataCache = async (pattern: string) => {
try{

  const stream = redis.scanStream({
    match: pattern,
    count: 100,
  });

  const pipeline = redis.pipeline();
  let toatalKeys = 0;

  // Process keys in batches
  stream.on("data", (keys: string[]) => {
    if (keys.length > 0) {
      keys.forEach((key) => {
        pipeline.del(key);
        toatalKeys++;
      });
    }
  });
      // Wrap stream events in a Promise

      new Promise<void>((resolve, reject) => {
        stream.on("end", async () => {
          try {
            if (toatalKeys > 0) {
              pipeline.exec();
              console.log(`Invalid ${toatalKeys} Keys`);
            }
            resolve();
          } catch (execError) {
            reject(execError);
          }
        });
      stream.on("error" ,error=>{
        reject(error)
      });
    });
}
catch (error) {
        console.error("Cache invalidation Error",error);
        throw error;
    }
  
};
