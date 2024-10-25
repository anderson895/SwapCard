/* eslint-disable @typescript-eslint/no-explicit-any */
import useStore from "./store";
const selector = (key:string) => (state:any) => state[key];
const storeProvider = useStore.getState();
export const{
    saveAdminInfo,
    logoutAdmin,
    saveUserInfo,
    logoutUser,
    selectChats,
    setOpenChats
} = storeProvider

export { selector, storeProvider };