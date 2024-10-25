/* eslint-disable @typescript-eslint/no-explicit-any */
import { setData } from "../hooks/useAddData";

export const saveUserData = async (user: any, provider: string) => {
    await setData('users', user.uid, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      provider: provider,
      phoneNumber:user.phoneNumber,
      photoURL: user.photoURL || '',
      type:'user'
    });
  };
  
  