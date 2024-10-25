/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from './axios';
import Endpoints from './endpoints';

export const EmailVerfication = {
    SEND:async(data:any) => await axiosInstance.post(Endpoints.EMAIL_VERIFICATION,data)
}
export const SentNotificationEmail = {
    SEND:async(data:any) => await axiosInstance.post(Endpoints.MAIL_REQUEST,data)
}