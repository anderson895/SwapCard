import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../db';

export const deleteData = async(collectionName:string,documentId:string):Promise<void> =>{
    try {
        const documentRef = doc(db, collectionName, documentId);
        await deleteDoc(documentRef);      
    } catch (error) {
        console.error("Error deleting document: ", error);
        throw error;      
    }
}