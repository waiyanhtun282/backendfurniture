
import  { redis } from  "../../config/redisClient";

export const getOrSetCache =  async ( key:any ,cb :any) =>{
    try {
     
        const cacheData = await redis.get(key);
        if(cacheData){
         console.log("Cache hint");
         return JSON.parse(cacheData);
        }

        console.log("Cache miss");
        const freshData = await cb();
        await redis.setex(key ,3600,JSON.stringify(freshData)); //cache for 1 hour
        return freshData;

    }catch(error){
        console.error({"Redis error":error});
        throw error;
    }
}