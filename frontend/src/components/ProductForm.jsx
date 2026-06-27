import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../utils/api';
// import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

const productSchema = z.object({
    product_name: z.string().min(1, "Nama produk wajib diisi."),
    product_cost: z.coerce.number({ invalid_type_error: "Harus berupa angka" }).min(500, "Minimal Rp 500"),
    product_price: z.coerce.number({ invalid_type_error: "Harus berupa angka" }).min(500, "Minimal Rp 500"),
    product_stock: z.coerce.number({ invalid_type_error: "Harus berupa angka" }).int("Harus bilangan bulat").min(0, "Stok tidak boleh negatif"),
    category_id_fk: z.string().optional().nullable(),
    expired_date: z.string().optional().nullable()
});

export default function ProductForm({ selectedProduct, initialData, onSave, onCancel }) {
    const [categories, setCategories] = useState([]);
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            product_name: "",
            product_cost: "",
            product_price: "",
            product_stock: "",
            category_id_fk: "",
            expired_date: ""
        }
    });

    const watchCategoryId = watch("category_id_fk");

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

    useEffect(() => {
        if (initialData) {
            setValue("product_name", initialData.name || "");
            setValue("product_cost", initialData.cost ?? "");
            setValue("product_price", initialData.price ?? "");
            setValue("product_stock", initialData.stock ?? "");
            setValue("category_id_fk", initialData.category_id ? String(initialData.category_id) : "");
            setValue("expired_date", initialData.expired_date || "");
        } else {
            reset();
        }
    }, [initialData, selectedProduct, setValue, reset]);

    const onSubmit = async (data) => {
        // Manual validation for expired_date dependency
        const selectedCategory = categories.find(cat => String(cat.category_id) === String(data.category_id_fk));
        if (selectedCategory && selectedCategory.requires_expired_date && !data.expired_date) {
            showToast(`Kategori "${selectedCategory.category_name}" mewajibkan input Tanggal Kedaluwarsa.`, 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                product_name: data.product_name,
                product_cost: data.product_cost,
                product_price: data.product_price,
                product_stock: data.product_stock,
                category_id_fk: data.category_id_fk || null,
                expired_date: data.expired_date || null
            });
            if (!selectedProduct) reset();
        } catch {
            // Error is already handled/toasted by Products.jsx, but if not we can add it here.
            // Since we rethrow in Products.jsx, we can catch it here if we want.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card mb-4">
            <h3 style={{ marginBottom: '20px' }}>{selectedProduct ? "Edit Product" : "Add Product"}</h3>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3 align-items-end mb-4">
                    <div className={`col-md-${watchCategoryId && categories.find(c => String(c.category_id) === String(watchCategoryId))?.requires_expired_date ? '4' : '8'}`}>
                        <Input 
                            label="Product Name"
                            placeholder="Ketik nama produk..." 
                            {...register("product_name")}
                            error={errors.product_name}
                            wrapperClassName="mb-0"
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-semibold">Kategori</label>
                        <select 
                            className={`form-select ${errors.category_id_fk ? 'is-invalid' : ''}`}
                            {...register("category_id_fk", {
                                onChange: () => setValue("expired_date", "")
                            })}
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                            ))}
                        </select>
                        {errors.category_id_fk && <div className="invalid-feedback d-block">{errors.category_id_fk.message}</div>}
                    </div>
                    {watchCategoryId && categories.find(c => String(c.category_id) === String(watchCategoryId))?.requires_expired_date && (
                        <div className="col-md-4">
                            <Input 
                                type="date" 
                                label="Tanggal Kedaluwarsa"
                                {...register("expired_date")}
                                error={errors.expired_date}
                                wrapperClassName="mb-0"
                            />
                        </div>
                    )}
                </div>

                <div className="row g-3 align-items-end mb-4">
                    <div className="col-md-3">
                        <Input 
                            type="number" 
                            label="Cost (Modal)"
                            placeholder="0" 
                            min="0"
                            {...register("product_cost")}
                            error={errors.product_cost}
                            wrapperClassName="mb-0"
                        />
                    </div>
                    <div className="col-md-3">
                        <Input 
                            type="number" 
                            label="Price (Harga Jual)"
                            placeholder="0" 
                            min="0"
                            {...register("product_price")}
                            error={errors.product_price}
                            wrapperClassName="mb-0"
                        />
                    </div>
                    <div className="col-md-3">
                        <Input 
                            type="number" 
                            label="Stock"
                            placeholder="0" 
                            min="0"
                            {...register("product_stock")}
                            error={errors.product_stock}
                            wrapperClassName="mb-0"
                        />
                    </div>
                    <div className="col-md-3 d-flex gap-2">
                        <Button 
                            type="submit" 
                            variant="primary" 
                            isLoading={isSubmitting}
                            className="w-100"
                        >
                            {selectedProduct ? "Update" : "Add"}
                        </Button>
                        
                        {selectedProduct && !isSubmitting && (
                            <Button 
                                type="button" 
                                variant="secondary"
                                className="w-100"
                                onClick={() => { reset(); onCancel(); }}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
