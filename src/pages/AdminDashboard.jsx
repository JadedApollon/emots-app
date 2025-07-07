import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import InventoryTable from '../components/dashboard/admin/InventoryTable'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "inventory"))
      setInventory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    }
    fetchData()
  }, [])

  return (
    <div className="admin-dashboard">
      <h1>Hoşgeldiniz, {user?.email}</h1>
      <InventoryTable data={inventory} />
    </div>
  )
}