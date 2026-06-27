/**
 * ProductList.jsx — Daftar produk dengan pencarian dan pagination
 * REFACTOR (F-S02): Diekstrak dari Products.jsx untuk modularisasi.
 */
import { useMemo } from 'react';
import { formatRupiah } from '../utils/format';

export default function ProductList({ products, searchTerm, onSearchChange, categories, selectedCategory, onCategoryChange, role, onEdit, onDelete, deletingId, pagination, onPageChange }) {
    // PERFORMANCE FIX (F-S17): Memoize filter agar tidak dihitung ulang setiap render
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const nameMatch = (p.product_name || p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
            const idMatch = String(p.product_id || p.id).includes(searchTerm);
            const categoryMatch = selectedCategory === "ALL" || String(p.category_id || p.category_id_fk) === String(selectedCategory);
            return (nameMatch || idMatch) && categoryMatch;
        });
    }, [products, searchTerm, selectedCategory]);

    return (
        <div className="card">
            <div style={{ marginBottom: "16px" }}>
                <h4 className="text-body fw-bold mb-3">Daftar Produk</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <input 
                            className="input product-search" 
                            placeholder="🔍 Cari nama atau ID produk..." 
                            style={{ width: "250px", padding: "6px 12px" }}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div>
                        <select 
                            className="input" 
                            style={{ padding: "6px 12px", minWidth: "180px", cursor: "pointer" }}
                            value={selectedCategory} 
                            onChange={(e) => onCategoryChange(e.target.value)}
                        >
                            <option value="ALL">-- Semua Kategori --</option>
                            {categories && categories.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                    <div key={p.product_id || p.id} className="product-item" style={{ alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                            <div className="product-item-header">
                                <div>
                                    <div className="product-item-meta d-flex align-items-center gap-2">
                                        <small className="text-muted">ID: {p.product_id || p.id}</small>
                                        {p.Category && (
                                            <span className="badge" style={{ background: '#E5E7EB', color: '#374151', padding: "2px 8px", fontSize: "10px" }}>
                                                <i className="fas fa-tag me-1"></i> {p.Category.category_name}
                                            </span>
                                        )}
                                        <span className={p.stock_status === "Low Stock" ? "badge low" : "badge safe"} 
                                              style={{ padding: "2px 8px", fontSize: "10px" }}>
                                            {p.stock_status || "Safe"}
                                        </span>
                                    </div>
                                    <b>{p.product_name || p.name}</b>
                                </div>
                                {(role === 'owner' || role === 'karyawan') && (
                                    <div>
                                        <button className="button" style={{ marginRight: "8px" }} onClick={() => onEdit(p)}>
                                            Edit
                                        </button>
                                        <button 
                                            className="button-delete" 
                                            onClick={() => onDelete(p.product_id || p.id)}
                                            disabled={deletingId === (p.product_id || p.id)}
                                        >
                                            {deletingId === (p.product_id || p.id) ? (
                                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span></>
                                            ) : (
                                                "Delete"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="stock" style={{ marginTop: "8px" }}>
                                Modal: {formatRupiah(p.product_cost)} | Jual: <span className="text-green fw-bold">{formatRupiah(p.product_price)}</span> | Stok: {p.product_stock}
                                {p.expired_date && p.product_stock > 0 && (
                                    <span className="ms-2 text-danger fw-medium" style={{ fontSize: "12px" }}>
                                        | <i className="fas fa-exclamation-circle me-1"></i> Exp: {new Date(p.expired_date).toLocaleDateString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted">
                    {searchTerm ? "Produk tidak ditemukan." : "Belum ada produk di database."}
                </p>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && !searchTerm && (
                <div className="product-pagination">
                    <span className="product-pagination-info">
                        Menampilkan halaman {pagination.currentPage} dari {pagination.totalPages} ({pagination.totalItems} produk)
                    </span>
                    <div className="product-pagination-buttons">
                        <button 
                            className="btn btn-outline-primary btn-sm" 
                            disabled={pagination.currentPage === 1}
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            style={{ borderRadius: "6px", padding: "5px 12px" }}
                        >
                            <i className="fas fa-chevron-left me-1"></i> Sebelumnya
                        </button>
                        <button 
                            className="btn btn-outline-primary btn-sm" 
                            disabled={pagination.currentPage === pagination.totalPages}
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            style={{ borderRadius: "6px", padding: "5px 12px" }}
                        >
                            Selanjutnya <i className="fas fa-chevron-right ms-1"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
