import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { 
    createAdminSlice,
    createCustomerSlice,
 } from '../slices';
import {type AdminSlice } from '../slices/Admin';
import {type CustomerSlice } from '../slices/User';

type TAppSlices = AdminSlice & CustomerSlice;
const useStore = create<TAppSlices>()(
    devtools(
        persist(
            (...args) => ({
              ...createAdminSlice(...args),
              ...createCustomerSlice(...args)
            }),
            {
              name: 'SWAPCARD',
            },
          ),
    )
)

export default useStore