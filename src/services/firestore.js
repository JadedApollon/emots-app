import { db } from './firebase'
import { 
  collection,
  addDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore'

// Örnek fonksiyon: Yeni envanter ekleme
export const addInventoryItem = async (itemData) => {
  try {
    const docRef = await addDoc(collection(db, "inventory"), itemData)
    return docRef.id
  } catch (error) {
    console.error("Firestore error:", error)
    throw error
  }
}

// Örnek fonksiyon: Kullanıcıya özel veri çekme
export const getUserInventory = async (userId) => {
  const q = query(
    collection(db, "inventory"),
    where("userId", "==", userId)
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}