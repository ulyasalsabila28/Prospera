import { useEffect, useMemo, useState } from "react";
import Dashboard from "../components/Dashboard";
import { authFetch } from "../utils/api";

export default function Transaction() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState("SELL");
  const [datetime, setDatetime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await authFetch("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await authFetch("/transactions/history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const selectedProduct = products.find((p) => String(p.product_id) === String(selectedProductId));

  const addItem = () => {
    if (!selectedProductId) {
      setMessage("Pilih produk terlebih dahulu.");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setMessage("Jumlah harus lebih dari 0.");
      return;
    }

    if (transactionType === "SELL" && selectedProduct.product_stock < qty) {
      setMessage(`Stok ${selectedProduct.product_name} tidak cukup.`);
      return;
    }

    setCartItems((current) => [
      ...current,
      {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: qty,
        type: transactionType,
        datetime: datetime || ""
      }
    ]);

    setSelectedProductId("");
    setQuantity("");
    setDatetime("");
    setMessage("");
  };

  const removeItem = (index) => {
    setCartItems((current) => current.filter((_, idx) => idx !== index));
  };

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      const perUnit = item.type === "SELL" ? (product?.product_price || 0) : (product?.product_cost || 0);
      return sum + perUnit * item.quantity;
    }, 0);
  }, [cartItems, products]);

  const saveTransaction = async () => {
    if (cartItems.length === 0) {
      setMessage("Tambahkan setidaknya satu produk sebelum menyimpan transaksi.");
      return;
    }

    const buyItems = cartItems.filter((item) => item.type === "BUY");
    const sellItems = cartItems.filter((item) => item.type === "SELL");
    setSaving(true);
    setMessage("");

    try {
      let buyMessage = "";
      let sellMessage = "";

      if (buyItems.length > 0) {
        for (const item of buyItems) {
          const product = products.find((p) => p.product_id === item.product_id);
          if (!product) throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);

          await authFetch(`/products/${item.product_id}`, {
            method: "PUT",
            body: JSON.stringify({
              product_name: product.product_name,
              product_cost: product.product_cost,
              product_price: product.product_price,
              product_stock: product.product_stock + item.quantity
            })
          });
        }
        buyMessage = `${buyItems.length} item pembelian berhasil ditambahkan ke stok.`;
      }

      if (sellItems.length > 0) {
        const payload = {
          items: sellItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        };

        const response = await authFetch("/transactions/checkout", {
          method: "POST",
          body: JSON.stringify(payload)
        });

        sellMessage = `Penjualan berhasil. Total: Rp${response.total_belanja}`;
      }

      const summary = [sellMessage, buyMessage].filter(Boolean).join(" ");
      setMessage(summary || "Transaksi berhasil disimpan.");
      setCartItems([]);
      fetchProducts();
      fetchHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dashboard>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <div>
            <h2>Transaction</h2>
            <p style={{ margin: 0, color: "#6B7280" }}>
              Pilih produk, masukkan quantity, dan simpan transaksi harian Anda.
            </p>
          </div>
        </div>

        {message && (
          <div style={{ padding: "12px", borderRadius: "10px", background: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E", marginBottom: "16px" }}>
            {message}
          </div>
        )}

        <div className="card" style={{ marginBottom: "24px" }}>
          <h3>Tambah Item Transaksi</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.75fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px" }}>Pilih Produk</label>
              <select className="input" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Pilih Produk</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} (Stok: {product.product_stock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px" }}>Quantity</label>
              <input className="input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px" }}>Tipe</label>
              <select className="input" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
                <option value="SELL">Sell</option>
                <option value="BUY">Buy</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px" }}>Datetime (opsional)</label>
              <input className="input" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
            </div>

            <button className="button" style={{ height: "42px" }} onClick={addItem}>
              + Tambah
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "24px" }}>
          <h3>Keranjang Transaksi</h3>
          {cartItems.length === 0 ? (
            <p style={{ color: "#6B7280" }}>Belum ada item transaksi.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB" }}>
                    <th style={{ padding: "10px" }}>Nama Produk</th>
                    <th style={{ padding: "10px" }}>Quantity</th>
                    <th style={{ padding: "10px" }}>Type</th>
                    <th style={{ padding: "10px" }}>Datetime</th>
                    <th style={{ padding: "10px" }}>Subtotal</th>
                    <th style={{ padding: "10px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => {
                    const product = products.find((p) => p.product_id === item.product_id);
                    return (
                      <tr key={`${item.product_id}-${index}`}>
                        <td style={{ padding: "10px" }}>{item.product_name}</td>
                        <td style={{ padding: "10px" }}>{item.quantity}</td>
                        <td style={{ padding: "10px" }}>{item.type}</td>
                        <td style={{ padding: "10px" }}>{item.datetime ? new Date(item.datetime).toLocaleString() : "-"}</td>
                        <td style={{ padding: "10px" }}>Rp{(item.type === "SELL" ? (product?.product_price || 0) : (product?.product_cost || 0)) * item.quantity}</td>
                        <td style={{ padding: "10px" }}>
                          <button className="button" style={{ background: "#EF4444", color: "white" }} onClick={() => removeItem(index)}>
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
            <div>
              <strong>Total:</strong> Rp{totalAmount}
            </div>
            <button className="button" onClick={saveTransaction} disabled={saving || cartItems.length === 0}>
              {saving ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Riwayat Transaksi</h3>
          {loading ? (
            <p>Loading history...</p>
          ) : history.length === 0 ? (
            <p style={{ color: "#6B7280" }}>Belum ada transaksi tersimpan.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #E5E7EB" }}>
                    <th style={{ padding: "10px" }}>Tanggal</th>
                    <th style={{ padding: "10px" }}>Total</th>
                    <th style={{ padding: "10px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((tx) => (
                    <tr key={tx.transaction_id}>
                      <td style={{ padding: "10px" }}>{tx.transaction_datetime ? new Date(tx.transaction_datetime).toLocaleString() : "-"}</td>
                      <td style={{ padding: "10px" }}>Rp{tx.total_amount}</td>
                      <td style={{ padding: "10px" }}>{tx.status || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
}
