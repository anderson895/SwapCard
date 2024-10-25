/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../db';
export const updateData = async (collectionName: string,documentId:string,dataToUpdate:any):Promise<void>  => {
    try {
        const documentRef = doc(db, collectionName, documentId);
        await updateDoc(documentRef, dataToUpdate);
      } catch (error) {
        console.error("Error updating document: ", error);
        throw error; 
      }
};