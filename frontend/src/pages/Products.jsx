import { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import { authFetch } from "../utils/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState("");
  
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const fetchProducts = async () => {
    try {
      const data = await authFetch("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Gagal load data produk:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.addEventListener("focus", fetchProducts);
    return () => window.removeEventListener("focus", fetchProducts);
  }, []);

  const saveProduct = async (e) => {
    e.preventDefault();

    if (!name || !cost || !price || !stock) {
      setMessage("Semua field harus diisi.");
      return;
    }

    const payload = {
      product_name: name,
      product_cost: Number(cost),
      product_price: Number(price),
      product_stock: Number(stock)
    };

    try {
      if (selectedProduct) {
        await authFetch(`/products/${selectedProduct}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setMessage("Produk berhasil diperbarui.");
      } else {
        await authFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setMessage("Produk berhasil ditambahkan.");
      }

      setRecentlyAdded({ name, cost, price, stock });
      setName("");
      setCost("");
      setPrice("");
      setStock("");
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      console.log("Error:", err);
      setMessage(`Gagal: ${err.message}`);
    }
  };

  const editProduct = (product) => {
    setSelectedProduct(product.product_id || product.id);
    setName(product.product_name || product.name || "");
    setCost(product.product_cost ?? "");
    setPrice(product.product_price ?? "");
    setStock(product.product_stock ?? "");
    setMessage("");
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      await authFetch(`/products/${productId}`, { method: "DELETE" });
      setMessage("Produk berhasil dihapus.");
      fetchProducts();
    } catch (err) {
      console.log("Error:", err);
      setMessage(`Gagal: ${err.message}`);
    }
  };

  // LOGIKA FILTER: Bisa cari berdasarkan Nama (product_name) ATAU ID (product_id)
  const filteredProducts = products.filter(p => {
    const nameMatch = (p.product_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = String(p.product_id || p.id).includes(searchTerm);
    return nameMatch || idMatch;
  });

  return (
    <>
      <div className="card">
        <h2>📦 Product Management</h2>

        {/* --- KOTAK PESAN (ALERT) --- */}
        {message && (
          <div style={{ 
            padding: "12px 16px", 
            borderRadius: "8px", 
            backgroundColor: message.includes("berhasil") ? "#dcfce7" : "#fee2e2", 
            color: message.includes("berhasil") ? "#16a34a" : "#dc2626",
            border: `1px solid ${message.includes("berhasil") ? "#4ade80" : "#f87171"}`,
            marginBottom: "20px",
            fontWeight: "500"
          }}>
            {message}
          </div>
        )}
        {/* --------------------------- */}

        <div className="card">
          <h3>{selectedProduct ? "Edit Product" : "Add Product"}</h3>
          <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <input className="input" placeholder="Product name" style={{ flex: "1 1 45%" }} value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Cost (Modal)" type="number" style={{ flex: "1 1 45%" }} value={cost} onChange={(e) => setCost(e.target.value)} />
            <input className="input" placeholder="Price (Harga Jual)" type="number" style={{ flex: "1 1 45%" }} value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="input" placeholder="Stock" type="number" style={{ flex: "1 1 45%" }} value={stock} onChange={(e) => setStock(e.target.value)} />
            <button type="button" className="button" onClick={saveProduct} style={{ flex: "1 1 100%", marginTop: "5px" }}>
              {selectedProduct ? "Update Product" : "Add Product"}
            </button>
            {selectedProduct && (
              <button type="button" className="button" style={{ flex: "1 1 100%", marginTop: "5px", background: "#6B7280" }} onClick={() => {
                setSelectedProduct(null);
                setName("");
                setCost("");
                setPrice("");
                setStock("");
                setMessage("");
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {recentlyAdded && (
          <div className="card" style={{ border: "2px solid #4caf50", backgroundColor: "#f1f8e9" }}>
            <h3 style={{ color: "#2e7d32", marginTop: 0 }}>✨ Recently Added</h3>
            <div className="product-item">
              <div>
                <b>{recentlyAdded.name}</b>
                <div className="stock">Baru saja berhasil didaftarkan ke database!</div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3>Daftar Produk</h3>
            <input 
              className="input" 
              placeholder="🔍 Cari nama atau ID produk..." 
              style={{ width: "300px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.product_id || p.id} className="product-item" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <small style={{ color: "gray" }}>ID: {p.product_id || p.id}</small>
                        <span className={(p.product_stock || p.stock) < 10 ? "badge low" : "badge safe"} style={{ padding: "2px 8px", fontSize: "10px" }}>
                          {(p.product_stock || p.stock) < 10 ? "Low" : "Safe"}
                        </span>
                      </div>
                      <b>{p.product_name || p.name}</b>
                    </div>
                    <div>
                      <button className="button" style={{ marginRight: "8px" }} onClick={() => editProduct(p)}>
                        Edit
                      </button>
                      <button className="button-delete" onClick={() => deleteProduct(p.product_id || p.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="stock" style={{ marginTop: "8px" }}>
                    Modal: Rp{p.product_cost} | Jual: Rp{p.product_price} | Stok: {p.product_stock}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "gray" }}>
              {searchTerm ? "Produk tidak ditemukan." : "Belum ada produk di database."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}