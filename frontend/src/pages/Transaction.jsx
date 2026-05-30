import { useEffect, useMemo, useState } from "react";
import { authFetch } from "../utils/api";

export default function Transaction() {
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [modal, setModal] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [datetime, setDatetime] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- STATE BARU UNTUK CUSTOM SEARCH DROPDOWN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // -----------------------------------------------

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

  // --- LOGIKA FILTER PENCARIAN PRODUK ---
  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // --------------------------------------

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

    const mod = Number(modal);
    if (!mod || mod <= 0) {
      setMessage("Modal harus lebih dari 0.");
      return;
    }

    const harga = Number(hargaJual);
    if (!harga || harga <= 0) {
      setMessage("Harga jual harus lebih dari 0.");
      return;
    }

    if (selectedProduct.product_stock < qty) {
      setMessage(`Stok ${selectedProduct.product_name} tidak cukup.`);
      return;
    }

    setCartItems((current) => [
      ...current,
      {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: qty,
        modal: mod,
        hargaJual: harga,
        datetime: datetime || ""
      }
    ]);

    setSelectedProductId("");
    setSearchTerm(""); // Reset text pencarian
    setQuantity("");
    setModal("");
    setHargaJual("");
    setDatetime("");
    setMessage("");
  };

  const removeItem = (index) => {
    setCartItems((current) => current.filter((_, idx) => idx !== index));
  };

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + item.hargaJual * item.quantity;
    }, 0);
  }, [cartItems]);

  const saveTransaction = async () => {
    if (cartItems.length === 0) {
      setMessage("Tambahkan setidaknya satu produk sebelum menyimpan transaksi.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const payload = {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          capital_cost: item.modal,
          selling_price: item.hargaJual
        }))
      };

      const response = await authFetch("/transactions/checkout", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setMessage(`Penjualan berhasil. Total: Rp${response.total_belanja}`);
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
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
          <div>
            <h2>Transaction</h2>
          </div>
        </div>

        {message && (
          <div style={{ padding: "12px", borderRadius: "10px", background: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E", marginBottom: "16px" }}>
            {message}
          </div>
        )}

        <div className="card" style={{ marginBottom: "24px" }}>
          <h3>Tambah Item Transaksi</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "end" }}>
              
              {/* --- BAGIAN CUSTOM SEARCH DROPDOWN --- */}
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", marginBottom: "6px" }}>Pilih Produk</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ketik untuk mencari produk..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    if (e.target.value === "") {
                      setSelectedProductId(""); // Reset ID jika dihapus
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  // Gunakan setTimeout agar onClick pada list item sempat dieksekusi sebelum dropdown tertutup
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  style={{ width: "100%" }}
                />
                
                {isDropdownOpen && (
                  <ul 
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #ced4da",
                      borderRadius: "8px",
                      maxHeight: "250px",
                      overflowY: "auto",
                      zIndex: 10,
                      listStyle: "none",
                      padding: 0,
                      margin: "4px 0 0 0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <li
                          key={product.product_id}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f3f4f6",
                            backgroundColor: selectedProductId === product.product_id ? "#eef2ff" : "white"
                          }}
                          onMouseDown={(e) => e.preventDefault()} // Mencegah onBlur input teraplikasi lebih dulu
                          onClick={() => {
                            setSelectedProductId(product.product_id);
                            setSearchTerm(product.product_name);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {product.product_name} (Stok: {product.product_stock})
                        </li>
                      ))
                    ) : (
                      <li style={{ padding: "10px 16px", color: "#6B7280", fontStyle: "italic" }}>
                        Produk tidak ditemukan...
                      </li>
                    )}
                  </ul>
                )}
              </div>
              {/* -------------------------------------- */}

              <div>
                <label style={{ display: "block", marginBottom: "6px" }}>Quantity</label>
                <input className="input" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr auto", gap: "12px", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px" }}>Modal</label>
                <input className="input" type="number" min="0" step="0.01" value={modal} onChange={(e) => setModal(e.target.value)} placeholder="Modal" />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px" }}>Harga Jual</label>
                <input className="input" type="number" min="0" step="0.01" value={hargaJual} onChange={(e) => setHargaJual(e.target.value)} placeholder="Harga Jual" />
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
                    <th style={{ padding: "10px" }}>Modal</th>
                    <th style={{ padding: "10px" }}>Harga Jual</th>
                    <th style={{ padding: "10px" }}>Datetime</th>
                    <th style={{ padding: "10px" }}>Subtotal</th>
                    <th style={{ padding: "10px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => {
                    return (
                      <tr key={`${item.product_id}-${index}`}>
                        <td style={{ padding: "10px" }}>{item.product_name}</td>
                        <td style={{ padding: "10px" }}>{item.quantity}</td>
                        <td style={{ padding: "10px" }}>Rp{item.modal}</td>
                        <td style={{ padding: "10px" }}>Rp{item.hargaJual}</td>
                        <td style={{ padding: "10px" }}>{item.datetime ? new Date(item.datetime).toLocaleString() : "-"}</td>
                        <td style={{ padding: "10px" }}>Rp{item.hargaJual * item.quantity}</td>
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
  );
}