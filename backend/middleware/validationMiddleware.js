/**
 * validationMiddleware.js — Middleware Validasi Input Terpusat
 * Semua logika validasi dipindahkan dari Controller ke sini
 * sesuai prinsip Clean Architecture & Separation of Concerns.
 */
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Regex standar industri untuk validasi format email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Batas maksimum integer untuk kolom MySQL INT (mencegah overflow)
// Nilai realistis bisnis: di bawah 1 miliar
const MAX_INTEGER = 999_999_999;

/**
 * Validasi input untuk registrasi pengguna baru
 */
const validateRegister = (req, res, next) => {
    const { username, email, password, phone_number } = req.body;

    if (!username || String(username).trim().length < 3) {
        return res.status(400).json({ message: "Nama Lengkap / Nama Toko wajib diisi dan minimal 3 karakter." });
    }

    if (String(username).trim().length > 100) {
        return res.status(400).json({ message: "Nama Lengkap / Nama Toko maksimal 100 karakter." });
    }

    if (!email || String(email).trim() === '') {
        return res.status(400).json({ message: "Email wajib diisi." });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ message: "Format email tidak valid." });
    }

    if (!password || String(password).length < 6) {
        return res.status(400).json({ message: "Password wajib diisi dan minimal 6 karakter." });
    }

    // SECURITY FIX (B-T10): Batas maksimal password untuk mencegah ReDoS pada Bcrypt
    // Bcrypt secara internal hanya memproses 72 byte pertama, sehingga password >64 char tidak berguna
    // dan bisa dimanfaatkan penyerang untuk mengirim string sangat panjang (DoS via slow hashing)
    if (String(password).length > 64) {
        return res.status(400).json({ message: "Password maksimal 64 karakter." });
    }

    // Sanitasi email
    req.body.username = String(username).trim();
    req.body.email = String(email).trim().toLowerCase();

    // Normalisasi Nomor Handphone ke E.164 (atau set null)
    if (!phone_number || String(phone_number).trim() === '') {
        req.body.phone_number = null;
    } else {
        let phone = String(phone_number).trim();
        
        // Parsing dan Validasi dengan libphonenumber-js (default ID jika tidak ada kode negara)
        const parsedPhoneNumber = parsePhoneNumberFromString(phone, 'ID');
        
        if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
            return res.status(400).json({ message: "Nomor handphone tidak valid atau format salah." });
        }
        
        // Simpan dalam format E.164 baku
        req.body.phone_number = parsedPhoneNumber.format('E.164');
    }

    next();
};

/**
 * Validasi input untuk login pengguna
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || String(email).trim() === '') {
        return res.status(400).json({ message: "Email wajib diisi." });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
        return res.status(400).json({ message: "Format email tidak valid." });
    }

    if (!password || String(password).trim() === '') {
        return res.status(400).json({ message: "Password wajib diisi." });
    }

    if (String(password).length > 64) {
        return res.status(400).json({ message: "Password maksimal 64 karakter." });
    }

    // Sanitasi email
    req.body.email = String(email).trim().toLowerCase();

    next();
};

/**
 * Validasi input untuk ganti password
 */
const validateChangePassword = (req, res, next) => {
    const { old_password, new_password } = req.body;

    if (!old_password || String(old_password).trim() === '') {
        return res.status(400).json({ message: "Password lama wajib diisi." });
    }

    if (!new_password || String(new_password).length < 6) {
        return res.status(400).json({ message: "Password baru wajib diisi dan minimal 6 karakter." });
    }

    if (old_password === new_password) {
        return res.status(400).json({ message: "Password baru tidak boleh sama dengan password lama." });
    }

    next();
};

/**
 * Validasi input untuk membuat atau memperbarui produk
 */
const validateProduct = (req, res, next) => {
    const { product_name, product_cost, product_price, product_stock } = req.body;

    // Validasi nama produk
    if (!product_name || String(product_name).trim() === '') {
        return res.status(400).json({ message: "Nama produk wajib diisi." });
    }

    // Validasi harga modal
    if (product_cost === undefined || product_cost === null || product_cost === '') {
        return res.status(400).json({ message: "Harga modal wajib diisi." });
    }
    if (isNaN(Number(product_cost)) || Number(product_cost) < 0) {
        return res.status(400).json({ message: "Harga modal harus berupa angka non-negatif." });
    }
    if (Number(product_cost) > MAX_INTEGER) {
        return res.status(400).json({ message: `Harga modal maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
    }

    // Validasi harga jual
    if (product_price === undefined || product_price === null || product_price === '') {
        return res.status(400).json({ message: "Harga jual wajib diisi." });
    }
    if (isNaN(Number(product_price)) || Number(product_price) < 0) {
        return res.status(400).json({ message: "Harga jual harus berupa angka non-negatif." });
    }
    if (Number(product_price) > MAX_INTEGER) {
        return res.status(400).json({ message: `Harga jual maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
    }

    // Validasi stok (opsional, default 0)
    if (product_stock !== undefined && product_stock !== null && product_stock !== '') {
        if (isNaN(Number(product_stock)) || Number(product_stock) < 0) {
            return res.status(400).json({ message: "Stok harus berupa angka non-negatif." });
        }
        if (!Number.isInteger(Number(product_stock))) {
            return res.status(400).json({ message: "Stok harus berupa bilangan bulat." });
        }
        if (Number(product_stock) > MAX_INTEGER) {
            return res.status(400).json({ message: `Stok maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
        }
    }

    // Sanitasi: konversi ke tipe data yang benar
    req.body.product_name = String(product_name).trim();
    req.body.product_cost = Number(product_cost);
    req.body.product_price = Number(product_price);
    req.body.product_stock = (product_stock !== undefined && product_stock !== null && product_stock !== '') 
        ? Number(product_stock) 
        : 0;

    next();
};

/**
 * Validasi input untuk membuat transaksi (checkout)
 */
const validateTransaction = (req, res, next) => {
    const { items, transaction_type } = req.body;

    // Validasi keranjang tidak boleh kosong
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Keranjang belanja kosong! Minimal harus ada 1 item." });
    }

    // Validasi transaction_type header (jika ada)
    if (transaction_type && !['sell', 'buy'].includes(transaction_type)) {
        return res.status(400).json({ message: "Tipe transaksi tidak valid. Gunakan 'sell' atau 'buy'." });
    }

    // Validasi setiap item dalam keranjang
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // product_id wajib ada dan berupa integer positif
        if (!item.product_id || !Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0) {
            return res.status(400).json({ message: `Item ke-${i + 1}: product_id harus berupa bilangan bulat positif.` });
        }

        // quantity wajib ada, integer positif, dan > 0
        if (!item.quantity || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
            return res.status(400).json({ message: `Item ke-${i + 1}: quantity harus berupa bilangan bulat positif (> 0).` });
        }
        if (Number(item.quantity) > MAX_INTEGER) {
            return res.status(400).json({ message: `Item ke-${i + 1}: quantity maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
        }

        // transaction_type per item (jika ada) harus valid
        if (item.transaction_type && !['sell', 'buy'].includes(item.transaction_type)) {
            return res.status(400).json({ message: `Item ke-${i + 1}: tipe transaksi tidak valid.` });
        }

        // Validasi harga override jika diberikan
        if (item.capital_cost !== undefined && item.capital_cost !== null) {
            if (isNaN(Number(item.capital_cost)) || Number(item.capital_cost) < 0) {
                return res.status(400).json({ message: `Item ke-${i + 1}: harga modal harus berupa angka non-negatif.` });
            }
            if (Number(item.capital_cost) > MAX_INTEGER) {
                return res.status(400).json({ message: `Item ke-${i + 1}: harga modal maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
            }
        }
        if (item.selling_price !== undefined && item.selling_price !== null) {
            if (isNaN(Number(item.selling_price)) || Number(item.selling_price) < 0) {
                return res.status(400).json({ message: `Item ke-${i + 1}: harga jual harus berupa angka non-negatif.` });
            }
            if (Number(item.selling_price) > MAX_INTEGER) {
                return res.status(400).json({ message: `Item ke-${i + 1}: harga jual maksimal ${MAX_INTEGER.toLocaleString('id-ID')}.` });
            }
        }

        // Sanitasi: konversi ke integer
        items[i].product_id = Number(item.product_id);
        items[i].quantity = Number(item.quantity);
    }

    next();
};

/**
 * Validasi parameter :id di URL (mencegah SQLi lewat route parameter)
 */
const validateIdParam = (req, res, next) => {
    const id = req.params.id;

    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ message: "Parameter ID tidak valid. Harus berupa bilangan bulat positif." });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateProduct,
    validateTransaction,
    validateIdParam
};
