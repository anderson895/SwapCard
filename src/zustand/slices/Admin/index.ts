/* eslint-disable @typescript-eslint/no-explicit-any */
import { type StateCreator } from "zustand/vanilla";

interface AdminState {
    loading?:boolean;
    info?: any | null;
    isAuthenticated?:boolean;
}
export interface AdminSlice{
    admin: AdminState | null;
    saveAdminInfo:(payload:any) => void;
    logoutAdmin: () => void;
}

const initialState: AdminState ={
    loading:false,
    info:null,
    isAuthenticated:false
}

const createAdminSlice: StateCreator<AdminSlice> = (set) => ({
    admin: initialState,
    saveAdminInfo:async(payload:any) =>{
      set((state) => ({
        ...state,
        admin: {
          ...state.admin,
          info: payload,
          isAuthenticated:true
        },
      }));
    },
    logoutAdmin:async() =>{
        try {
            set(() => ({
              admin: initialState, 
            }));
          } catch (error) {
            console.error('Logout error:', error);
          }
    },
})

export default createAdminSlice