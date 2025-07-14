export const checkUserExits =  (user: any) => {
   if(user) {
        const error: any = new Error("This phone number has been already existed");
        error.status = 409;
        error.code = "Error_UserExists";
        throw error;
   }
};

export const checkOtpErrorIfSameDate = (isSameDate:boolean ,errorCount:number) =>{
   if(isSameDate && errorCount === 5){
      const error :any =new Error(
        "Otp is wrong for 5 times.Please try again on tomoorrow"    
      );
      error.status =401;
      error.code ="Error_OverLimit";
      throw error;
   }
};

export const checkOtpRow = (otpRow: any) => {
  if (!otpRow) {
    const error: any = new Error("Phone number is incorrect.");
    error.status = 400;
    error.code = "Invlid_Phone";
    throw error;
  }
};