/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timestamp } from "firebase/firestore";

export interface CardData {
    status: string;
    desiredCards: string;
    ownerEmail: string;
    displayName: string;
    ownerId: string;
    id: string;
    playerName: string;
    cardNumber: string;
    playerTeam: string;
    yearManufactured: string;
    collection: string;
    type: string;
    condition: string;
    imageUrl: string;
    uid:string;
    createdAt: Timestamp;
    expirationDate:Timestamp;
  }

  export interface SwapOffer{
    receiverCardNumber: string;
    receiverCardImageUrl: string;
    requesterDisplayName: string;
    id: string;
    createdAt:Timestamp;
    receiverCardId:string;
    receiverId:string;
    requesterCardId:string;
    requesterId:string;
    status:string;
  }

  export interface UserProfileData{
    phoneNumber: string | null;
    isVerified: any;
    id: string;
    displayName:string;
    email:string;
    photoURL:string;
    uid:string;
    provider:string;
    isPhoneNumberVisible:boolean;
    type:string;

  }

  export interface TransactionData{
    id: string;
    createdAt: Timestamp;
    receiverCardId:string;
    receiverId:string;
    requesterCardId:string;
    requesterId:string;
    status:string;
    requesterCardDetails: any | null;
    receiverCardDetails: any | null;
    receiverDisplayName:string;
    requesterDisplayName:string;
  }

  export interface RatingData{
    createdAt: any;
    id: string;
    rating: number;
    comment:string;
    timestamp: Timestamp;
    ratedUserId:string;
    displayName:string;
    email:string;
    photoURL:string;
    uid:string;
    provider:string;
    raterUserId:string;
  }