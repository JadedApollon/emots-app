import { useFirestore } from '../../hooks/useFirestore';

export default function InventoryTable() {
  const { documents: inventory, error } = useFirestore('inventory');
  
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Ürün Adı</th>
          <th>UBB</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        {inventory.map(item => (
          <tr key={item.id}>
            <td>{item.productInfo?.name}</td>
            <td>{item.ubb}</td>
            <td>{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}