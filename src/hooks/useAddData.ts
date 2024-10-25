/* eslint-disable @typescript-eslint/no-explicit-any */
import { collection, addDoc, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../db';

export const addData = async (collectionName: string,dataToAdd:any): Promise<string>  => {
    try {
        const Datacollection = collection(db,collectionName)
        const docRef = await addDoc(Datacollection, dataToAdd);
        return docRef.id;
      } catch (error) {
        console.error("Error adding document: ", error);
        throw error; 
      }
};
export const setData = async (collectionName: string, id: string, dataToAdd: any): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Document exists, so update specific fields
      await updateDoc(docRef, dataToAdd);
    } else {
      // Document does not exist, so set the entire document
      await setDoc(docRef, dataToAdd);
    }
  } catch (error) {
    console.error("Error setting or updating document: ", error);
    throw error; 
  }
};