/**
 * api.js — Modul API Terpusat (Single Source of Truth)
 * Menangani semua komunikasi dengan backend, autentikasi,
 * dan manajemen sesi secara konsisten.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==================== MANAJEMEN SESI ====================

/**
 * Mengambil token (DEPRECATED - Cookie Based Auth)
 */
export const getToken = () => null;

/**
 * Mengambil data user dari sessionStorage
 */
export const getCurrentUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
        return null;
    }
};

/**
 * Mengambil role user saat ini dari sessionStorage
 * SECURITY FIX (F-S10): Validasi role terhadap whitelist yang diizinkan.
 * Jika role di-manipulasi manual (misal: 'admin', 'superuser'), akan ditolak.
 * @returns {'owner'|'karyawan'|null}
 */
const ALLOWED_ROLES = ['owner', 'karyawan'];

export const getUserRole = () => {
    const user = getCurrentUser();
    const role = user?.role || null;
    // Tolak role yang tidak ada dalam whitelist
    if (role && !ALLOWED_ROLES.includes(role)) {
        console.error(`[Security] Role tidak dikenali: "${role}". Sesi dihapus.`);
        clearAuthSession();
        return null;
    }
    return role;
};

/**
 * Menyimpan sesi autentikasi (data user saja, JWT ada di HttpOnly Cookie)
 */
export const setAuthSession = (token, user) => {
    sessionStorage.setItem("user", JSON.stringify(user));
};

/**
 * Menghapus seluruh sesi autentikasi dari sessionStorage
 */
export const clearAuthSession = () => {
    sessionStorage.removeItem("user");
};

/**
 * Memeriksa apakah sesi pengguna valid berdasarkan eksistensi data user.
 * Keamanan sebenarnya berada di level HttpOnly Cookie & Backend Interceptor.
 * @returns {boolean} true jika user ada di session
 */
export const isTokenValid = () => {
    const user = getCurrentUser();
    return user !== null;
};

// ==================== FETCH WRAPPER TERPUSAT ====================

/**
 * Custom Error Class untuk membedakan error API (aman untuk UI)
 * dari runtime JS error (raw technical error).
 */
export class ApiError extends Error {
    constructor(message, data = null) {
        super(message);
        this.name = "ApiError";
        this.data = data;
    }
}

/**
 * apiFetch — Fungsi fetch terpusat untuk semua komunikasi API.
 * Menangani:
 *   - Penyisipan Authorization header secara otomatis
 *   - HTTP 401/403 → redirect ke login
 *   - HTTP 429 → pesan rate limit dari backend
 *   - Error generik untuk status lainnya
 *
 * @param {string} endpoint - Path API (misal: "/products")
 * @param {object} options  - Opsi fetch (method, body, headers, dll.)
 * @returns {Promise<any>}  - Data JSON dari response
 */
export const apiFetch = async (endpoint, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include' // FIX (V4.0): Kirim HttpOnly Cookie
        });
    } catch (error) {
        // Log technical error for developers
        console.error(`[API Network Error] at ${endpoint}:`, error);
        throw new ApiError("Koneksi ke server terputus. Pastikan server aktif dan perangkat Anda terhubung ke internet.");
    }

    // --- HANDLER: Token expired / Unauthorized ---
    if (response.status === 401) {
        const currentPath = window.location.pathname;
        if (!endpoint.includes("/auth/login") && currentPath !== "/login" && currentPath !== "/register") {
            clearAuthSession();
            window.location.href = "/login";
            throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.");
        }
    }

    // --- HANDLER: Forbidden (RBAC / Time Access) ---
    if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 403 Forbidden] at ${endpoint}:`, data);
        if (data.require_pin) {
            throw new ApiError(data.message || "Toko tutup. Masukkan PIN.", data);
        }
        throw new ApiError("Anda tidak memiliki hak akses untuk fitur ini.", data);
    }

    // --- HANDLER: Rate Limit Exceeded ---
    if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 429 Rate Limit] at ${endpoint}:`, data);
        throw new ApiError("Terlalu banyak aktivitas. Silakan tunggu beberapa saat lalu coba lagi.");
    }

    // --- Parse response ---
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        // Log technical error for developers
        console.error(`[API HTTP Error] ${response.status} at ${endpoint}:`, data || response.statusText);
        
        // Return user-friendly message
        if (response.status >= 500) {
            throw new ApiError("Terjadi gangguan pada sistem kami. Silakan coba lagi beberapa saat kemudian.");
        }
        
        // Return backend validation message if available (usually user-friendly like "Email sudah digunakan")
        throw new ApiError(data?.message || "Permintaan tidak dapat diproses. Silakan periksa kembali data Anda.");
    }

    return data;
};

/**
 * apiFetchBlob — Fetch khusus untuk download file (Excel, CSV).
 * Mengembalikan Blob, bukan JSON.
 *
 * @param {string} endpoint - Path API
 * @returns {Promise<Blob>}
 */
export const apiFetchBlob = async (endpoint) => {
    const token = getToken();
    const headers = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
            credentials: 'include' // CRITICAL BUG FIX: missing credentials caused 401 redirect
        });
    } catch (error) {
        console.error(`[API Network Error] at ${endpoint}:`, error);
        throw new ApiError("Koneksi ke server terputus. Pastikan server aktif dan perangkat Anda terhubung ke internet.");
    }

    if (response.status === 401 || response.status === 403) {
        clearAuthSession();
        window.location.href = "/login";
        throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.");
    }

    if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        console.error(`[API 429 Rate Limit] at ${endpoint}:`, data);
        throw new ApiError("Terlalu banyak aktivitas. Silakan tunggu beberapa saat lalu coba lagi.");
    }

    if (!response.ok) {
        console.error(`[API HTTP Error] ${response.status} at ${endpoint}:`, response.statusText);
        throw new ApiError("Gagal mengunduh file dari server. Silakan coba lagi beberapa saat kemudian.");
    }

    return response.blob();
};

/**
 * formatError — Mengekstrak pesan error untuk UI.
 * Memastikan hanya pesan yang ramah pengguna (ApiError) yang dirender,
 * sementara raw JS/Runtime error akan di-log dan diganti dengan fallback.
 * 
 * @param {Error|any} error - Objek error dari catch block
 * @returns {string} - Pesan error bahasa Indonesia yang aman untuk UI
 */
export const formatError = (error) => {
    if (error instanceof ApiError) {
        return error.message;
    }
    // Log raw JS error untuk keperluan debugging developer
    console.error("[Runtime UI Error]:", error);
    return "Terjadi kendala teknis internal. Silakan muat ulang (refresh) halaman.";
};

// --- SMART FEATURES API ---
export const getExpiringProducts = async () => {
    return await apiFetch('/smart-features/expiring', {
        method: 'GET'
    });
};

export const applyMarkdown = async (product_id, new_price) => {
    return await apiFetch('/smart-features/apply-markdown', {
        method: 'PUT',
        body: JSON.stringify({ product_id, new_price })
    });
};

export const getAnomalies = async () => {
    return await apiFetch('/smart-features/anomalies', {
        method: 'GET'
    });
};

export const resolveAnomaly = async (payload) => {
    return await apiFetch('/smart-features/anomalies/resolve', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

export const writeOffExpiredStock = async (product_id) => {
    return await apiFetch('/smart-features/expiry/write-off', {
        method: 'PUT',
        body: JSON.stringify({ product_id })
    });
};

// --- STORE SETTINGS API ---
export const getStoreSettings = async () => {
    return await apiFetch('/store-settings', {
        method: 'GET'
    });
};

export const updateStoreSettings = async (settings) => {
    return await apiFetch('/store-settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
};

export default API_BASE_URL;
