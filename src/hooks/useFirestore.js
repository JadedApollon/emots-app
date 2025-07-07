import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useFirestore = (collectionName, conditions = []) => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = collection(db, collectionName);
    
    if (conditions.length > 0) {
      q = query(q, ...conditions.map(cond => where(...cond)));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docs);
      },
      (err) => setError(err.message)
    );

    return () => unsubscribe();
  }, [collectionName, conditions]);

  return { documents, error };
};