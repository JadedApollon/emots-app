export default function InventoryTable({ data }) {
  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Ürün Adı</th>
          <th>Miktar</th>
          <th>Durum</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>{item.productName}</td>
            <td>{item.quantity}</td>
            <td>{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}