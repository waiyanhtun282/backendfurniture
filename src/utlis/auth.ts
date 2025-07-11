export const checkUserExits =  (user: any) => {
   if(user) {
        const error: any = new Error("This phone number has been already existed");
        error.status = 409;
        error.code = "Error_UserExists";
        throw error;
   }
}