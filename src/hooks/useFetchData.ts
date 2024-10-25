/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-useless-catch */
import { db } from "../db";
import { collection, CollectionReference, query, where, getDocs, DocumentData, Query, DocumentReference, doc, getDoc } from "firebase/firestore";

export const fetchData = async (collectionName:string) =>{
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const newData = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id
        }))
        return newData
    } catch (error) {
        throw error;
    }
}

export const fetchDataCondition = async (collectionName: string, conditions: { field: string; operator: string; value: any }[] = []) => {
    try {
      let queryRef: CollectionReference<DocumentData> | Query<DocumentData> = collection(db, collectionName);
  
      // Apply conditions to the query
      if (conditions.length > 0) {
        conditions.forEach((condition) => {
          const { field, operator, value } = condition;
          queryRef = query(queryRef, where(field, operator as any, value)); // as any to bypass type check
        });
      }
  
      const querySnapshot = await getDocs(queryRef);
      const newData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      return newData;
    } catch (error) {
      throw error;
    }
  };

  export const fetchDataById = async (collectionName: string, documentId: string) => {
    try {
        const docRef: DocumentReference<DocumentData> = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { ...docSnap.data(), id: docSnap.id };
        } else {
            throw new Error(`Document with ID ${documentId} does not exist in collection ${collectionName}`);
        }
    } catch (error) {
        throw error;
    }
};