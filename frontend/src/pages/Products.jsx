/**
 * Products.jsx — Halaman Manajemen Produk (Orchestrator)
 * REFACTOR (F-S02): Logika form & list dipecah ke ProductForm.jsx dan ProductList.jsx.
 * File ini hanya menjadi "pengatur" state utama dan API calls.
 * 
 * Sebelum: 290 baris (form + list + pagination semua inline)
 * Sesudah: ~105 baris (state + API calls saja)
 */
import { useEffect, useState, useCallback } from "react";
import { apiFetch, getUserRole, formatError } from "../utils/api";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import { useToast } from "../contexts/ToastContext";
import { useConfirm } from "../contexts/ConfirmContext";

export default function Products() {
  const role = getUserRole();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // PERFORMANCE FIX (F-S16): useCallback mencegah re-create fungsi setiap render
  const fetchProducts = useCallback(async (page = 1) => {
    try {
      const data = await apiFetch(`/products?page=${page}&limit=${limit}`);
      if (data.products) {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        setCurrentPage(data.currentPage);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      showToast(formatError(error), 'danger');
    }
  }, [limit, showToast]);

  useEffect(() => {
    fetchProducts();
    window.addEventListener("focus", fetchProducts);
    return () => window.removeEventListener("focus", fetchProducts);
  }, [fetchProducts]);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiFetch("/categories");
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Gagal memuat kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = async (payload) => {
    try {
      if (selectedProduct) {
        await apiFetch(`/products/${selectedProduct}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showToast("Produk berhasil diperbarui.", 'success');
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showToast("Produk berhasil ditambahkan.", 'success');
      }
      setSelectedProduct(null);
      setEditData(null);
      fetchProducts(currentPage);
    } catch (error) {
      showToast(formatError(error), 'danger');
      throw error; // Rethrow to let ProductForm know about the failure
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product.product_id || product.id);
    setEditData({
      name: product.product_name || product.name || "",
      cost: product.product_cost ?? "",
      price: product.product_price ?? "",
      stock: product.product_stock ?? "",
      category_id: product.category_id_fk || "",
      expired_date: product.expired_date || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    showConfirm({
      title: 'Hapus Produk',
      message: 'Apakah Anda yakin ingin menghapus produk ini? Aksi ini tidak dapat dibatalkan.',
      isDanger: true,
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        setDeletingId(productId);
        try {
          await apiFetch(`/products/${productId}`, { method: "DELETE" });
          showToast("Produk berhasil dihapus.", 'success');
          fetchProducts(currentPage);
        } catch (err) {
          showToast(formatError(err), 'danger');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setEditData(null);
  };

  return (
    <>
      <div className="card">
        <h2>📦 Product Management</h2>

        {(role === 'owner' || role === 'karyawan') && (
          <ProductForm 
            selectedProduct={selectedProduct}
            initialData={editData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <ProductList 
          products={products}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          role={role}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
          pagination={{ currentPage, totalPages, totalItems }}
          onPageChange={fetchProducts}
        />
      </div>
    </>
  );
}