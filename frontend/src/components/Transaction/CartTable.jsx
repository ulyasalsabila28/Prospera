import { formatRupiah, formatDatetime } from '../../utils/format';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CartTable({
  cartItems, removeItem, setCartItems, saveTransaction, saving, totalAmount
}) {
  const { showConfirm } = useConfirm();

  const handleClearCart = () => {
      showConfirm({
          title: "Kosongkan Keranjang?",
          message: "Apakah Anda yakin ingin mengosongkan semua item dalam keranjang ini?",
          confirmText: "Ya, Kosongkan",
          isDanger: true,
          onConfirm: () => setCartItems([])
      });
  };

  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <h3 style={{ marginTop: 0 }}>Keranjang Belanja</h3>
      {cartItems.length === 0 ? (
        <p className="text-muted">Belum ada item transaksi.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table-simple" style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Nama Produk</th>
                <th>Quantity</th>
                <th>Total Modal</th>
                <th>Total Harga</th>
                <th>Tipe</th>
                <th>Datetime</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
                const subTotal = item.transactionType === 'buy'
                  ? item.modal * item.quantity
                  : item.hargaJual * item.quantity;
                  
                return (
                  <tr key={index}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatRupiah(item.modal * item.quantity)}</td>
                    <td>{formatRupiah(item.hargaJual * item.quantity)}</td>
                    <td>
                      <span className={item.transactionType === "sell" ? "badge safe" : "badge low"}>
                        {item.transactionType === "sell" ? "Jual" : "Beli"}
                      </span>
                    </td>
                    <td>{formatDatetime(item.datetime)}</td>
                    <td className="fw-bold">{formatRupiah(subTotal)}</td>
                    <td>
                      <button 
                        className="button-delete" 
                        onClick={() => removeItem(index)}
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div><strong>Total:</strong> {formatRupiah(totalAmount)}</div>
        
        <div style={{ display: "flex", gap: "12px" }}>
            <button 
                className="button" 
                style={{ background: "transparent", color: "#EF4444", border: "1px solid #EF4444", opacity: cartItems.length === 0 ? 0.5 : 1, cursor: cartItems.length === 0 ? "not-allowed" : "pointer" }} 
                onClick={handleClearCart} 
                disabled={saving || cartItems.length === 0}
            >
                Kosongkan Keranjang
            </button>
            <button className="button" onClick={saveTransaction} disabled={saving || cartItems.length === 0}>
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
        </div>
      </div>
    </div>
  );
}