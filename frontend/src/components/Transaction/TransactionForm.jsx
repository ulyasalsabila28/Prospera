import { useState, useRef } from "react";
import { formatRupiah } from "../../utils/format";

/**
 * TransactionForm.jsx
 * FIX (MEDIUM-FE-01): Tambah keyboard navigation di dropdown produk.
 * ArrowDown/Up untuk navigasi, Enter untuk pilih, Escape untuk tutup.
 *
 * Strength yang dipertahankan:
 * - Validasi qty (isNegativeOrZero, isOverStock, isFatFinger) tidak diubah
 * - Total kalkulasi (totalModal, totalHargaJual) tidak diubah
 * - Semua props interface tidak diubah — Transaction.jsx tidak perlu dimodifikasi
 */
export default function TransactionForm({
  searchTerm, setSearchTerm, isDropdownOpen, setIsDropdownOpen,
  filteredProducts, selectedProductId, setSelectedProductId,
  transactionType, setTransactionType, quantity, setQuantity,
  modal, hargaJual, datetime, setDatetime,
  addItem
}) {
  // FIX (MEDIUM-FE-01): State untuk index item yang di-highlight via keyboard
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxRef = useRef(null);

  const selectedProductObj = filteredProducts.find(p => p.product_id === selectedProductId);
  const qtyNum = Number(quantity) || 0;
  const isNegativeOrZero = qtyNum <= 0 && quantity !== "";
  const isOverStock = transactionType === "sell" && selectedProductObj && qtyNum > selectedProductObj.product_stock;
  const isFatFinger = qtyNum > 1000;
  
  const totalModal = qtyNum * (Number(modal) || 0);
  const totalHargaJual = qtyNum * (Number(hargaJual) || 0);

  const isInvalid = !selectedProductId || isNegativeOrZero || isOverStock || isFatFinger;

  // Pilih produk dari dropdown (dipakai oleh click dan keyboard Enter)
  const selectProduct = (product) => {
    setSelectedProductId(product.product_id);
    setSearchTerm(product.product_name);
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  // FIX (MEDIUM-FE-01): Handler keyboard untuk input pencarian produk
  const handleSearchKeyDown = (e) => {
    if (!isDropdownOpen || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
        selectProduct(filteredProducts[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <h3>Tambah Item Transaksi</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "end" }}>
          
          <div style={{ position: "relative" }}>
            <label style={{ display: "block", marginBottom: "6px" }} htmlFor="product-search">Pilih Produk</label>
            <input
              id="product-search"
              className="input"
              type="text"
              placeholder="Ketik untuk mencari produk..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
                setHighlightedIndex(-1);
                if (e.target.value === "") setSelectedProductId(""); 
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => { setIsDropdownOpen(false); setHighlightedIndex(-1); }, 200)}
              onKeyDown={handleSearchKeyDown}
              style={{ width: "100%" }}
              // ARIA: hubungkan input dengan listbox untuk screen reader
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-autocomplete="list"
              aria-controls="product-listbox"
              aria-activedescendant={highlightedIndex >= 0 ? `product-option-${highlightedIndex}` : undefined}
              autoComplete="off"
            />
            
            {isDropdownOpen && (
              <ul
                id="product-listbox"
                ref={listboxRef}
                role="listbox"
                aria-label="Daftar produk"
                className="dropdown-menu show w-100 shadow"
                style={{ position: "absolute", top: "100%", left: 0, right: 0, maxHeight: "250px", overflowY: "auto", zIndex: 10, margin: "4px 0 0 0" }}
              >
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => {
                    const isHighlighted = highlightedIndex === index;
                    const isSelected = selectedProductId === product.product_id;
                    return (
                      <li
                        key={product.product_id}
                        id={`product-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        className={`dropdown-item ${isHighlighted ? 'active' : ''} ${isSelected && !isHighlighted ? 'bg-body-secondary' : ''}`}
                        style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid var(--bs-border-color-translucent)" }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseDown={(e) => e.preventDefault()} 
                        onClick={() => selectProduct(product)}
                      >
                        {product.product_name} (Stok: {product.product_stock})
                      </li>
                    );
                  })
                ) : (
                  <li role="option" aria-selected="false" className="dropdown-item disabled" style={{ padding: "10px 16px", fontStyle: "italic" }}>Produk tidak ditemukan...</li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px" }} htmlFor="transaction-type">Tipe Transaksi</label>
            <select id="transaction-type" className="input" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="sell">Penjualan (Sell)</option>
              <option value="buy">Restock (Buy)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }} htmlFor="qty-input">Quantity</label>
            <input 
              id="qty-input"
              className={`input ${isNegativeOrZero || isOverStock || isFatFinger ? 'border border-danger text-danger' : ''}`} 
              type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" 
              aria-describedby={isNegativeOrZero ? "qty-error-min" : isOverStock ? "qty-error-stock" : isFatFinger ? "qty-error-max" : undefined}
            />
            {isNegativeOrZero && <div id="qty-error-min" className="text-danger mt-1" role="alert" style={{ fontSize: "12px", position: "absolute" }}>⚠ Minimal 1</div>}
            {isOverStock && <div id="qty-error-stock" className="text-danger mt-1" role="alert" style={{ fontSize: "12px", position: "absolute" }}>⚠ Sisa {selectedProductObj.product_stock}</div>}
            {isFatFinger && <div id="qty-error-max" className="text-danger mt-1" role="alert" style={{ fontSize: "12px", position: "absolute" }}>⚠ Maksimal 1000</div>}
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>Total Modal</label>
            <input className="input form-control bg-body-tertiary" type="text" value={totalModal} readOnly placeholder="Total Modal" style={{ cursor: "not-allowed" }} aria-label={`Total modal: ${totalModal}`} />
            {qtyNum > 0 && <div className="text-muted mt-1" style={{ fontSize: "12px", position: "absolute" }}>📦 Modal Satuan: {formatRupiah(modal)}</div>}
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }}>{transactionType === "sell" ? "Total Harga Jual" : "Total Harga Beli"}</label>
            <input className="input form-control bg-body-tertiary" type="text" value={totalHargaJual} readOnly placeholder={transactionType === "sell" ? "Total Jual" : "Total Beli"} style={{ cursor: "not-allowed" }} aria-label={`Total harga: ${totalHargaJual}`} />
            {qtyNum > 0 && <div className={`mt-1 ${isOverStock || isNegativeOrZero || isFatFinger ? 'text-danger' : 'text-success'} fw-medium`} style={{ fontSize: "12px", position: "absolute" }}>🏷 Harga Satuan: {formatRupiah(hargaJual)}</div>}
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px" }} htmlFor="datetime-input">Datetime (ops)</label>
            <input id="datetime-input" className="input" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
          </div>
          
          <button 
            className="button" 
            style={{ 
                height: "42px",
                background: isInvalid ? "#9CA3AF" : "",
                cursor: isInvalid ? "not-allowed" : "pointer"
            }} 
            onClick={addItem}
            disabled={isInvalid}
            aria-disabled={isInvalid}
          >
            + Tambah
          </button>
        </div>
      </div>
    </div>
  );
}