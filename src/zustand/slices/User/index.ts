/* eslint-disable @typescript-eslint/no-explicit-any */
import { type StateCreator } from "zustand/vanilla";

interface CustomerState {
  loading?: boolean;
  info?: any | null;
  isLogin?: boolean;
  conversationId?: string | null;
  isChatOpen?: boolean;
  responseMsg?: string;
}
export interface CustomerSlice {
  user: CustomerState | null;
  saveUserInfo: (payload: any) => void;
  selectChats: (payload: any) => void;
  setOpenChats: (payload: any) => void;
  logoutUser: () => void;
}

const initialState: CustomerState = {
  loading: false,
  info: null,
  responseMsg: "",
  conversationId: null,
};

const createCustomerSlice: StateCreator<CustomerSlice> = (set) => ({
  user: initialState,
  saveUserInfo: async (payload: any) => {
    try {
      const process = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      });
      if (typeof payload !== "string" && process) {
        set((state) => ({
          ...state,
          user: {
            ...state.user,
            info: {
              ...state.user?.info,
              ...payload,
            },
            isLogin: true,
            loading: false,
            responseMsg: "",
          },
        }));
      }
    } catch (error) {
      console.log("Error at: ", error);
      set((state) => ({
        ...state,
        user: {
          ...state.user,
          info: null,
          loading: false,
          responseMsg: "Invalid Credentials",
        },
      }));
    }
  },
  setOpenChats: async (payload: boolean) => {
    set((state) => ({
      ...state,
      user: {
        ...state.user,
        isChatOpen: payload,
        responseMsg: "",
      },
    }));
  },
  selectChats: async (payload: any) => {
    set((state) => ({
      ...state,
      user: {
        ...state.user,
        conversationId: payload,
        responseMsg: "",
      },
    }));
  },
  logoutUser: async () => {
    try {
      set(() => ({
        user: initialState,
      }));
    } catch (error) {
      console.error("Logout error:", error);
    }
  },
});

export default createCustomerSlice;
