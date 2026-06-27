/**
 * transactionHelpers.js — Fungsi Pembantu Transaksi
 * Sanitasi XSS diterapkan pada fungsi cetak struk.
 */

/**
 * KEAMANAN: Escape karakter HTML berbahaya untuk mencegah XSS
 * pada fungsi cetak struk (document.write).
 */
const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Fungsi pembantu untuk memformat label tipe transaksi
export const getTransactionTypeLabel = (transaction) => {
    if (!transaction?.TransactionDetails || transaction.TransactionDetails.length === 0) {
      return transaction.transaction_type ? transaction.transaction_type.toUpperCase() : "-";
    }
  
    const uniqueTypes = Array.from(new Set(transaction.TransactionDetails.map((item) => item.transaction_type)));
    return uniqueTypes.length === 1 ? uniqueTypes[0].toUpperCase() : "MIXED";
};

// Fungsi pencetak struk kasir (Isolated Print — XSS-safe)
export const printReceipt = (transactionData) => {
    if (!transactionData) return;

    // Normalisasi struktur data karena bisa dipanggil dari Cart (state lokal) atau History (API backend)
    const isFromHistory = !!transactionData.TransactionDetails;
    const items = isFromHistory ? transactionData.TransactionDetails : transactionData.items;
    
    // Perbaikan: import formatDatetime di awal atau tidak perlu jika history sudah string, tapi lebih aman dicek.
    const date = isFromHistory 
        ? new Date(transactionData.transaction_datetime).toLocaleString('id-ID')
        : transactionData.date;
        
    const total = isFromHistory ? transactionData.total_amount : transactionData.total;
    const typeLabel = isFromHistory ? getTransactionTypeLabel(transactionData) : (transactionData.type === 'sell' ? 'Penjualan' : 'Restock');

    const printWindow = window.open('', '', 'height=600,width=400');

    // UX FIX (F-S14): Tangani pop-up blocker browser
    if (!printWindow) {
        alert('Gagal membuka jendela cetak. Browser Anda mungkin memblokir pop-up.\n\nSilakan izinkan pop-up untuk situs ini di pengaturan browser, lalu coba lagi.');
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Struk Transaksi</title>
            <style>
                /* Reset margin standar browser saat print */
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 1cm; }
                }
                
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    color: #000;
                    background: #fff;
                }
                
                /* Wadah pembungkus struk */
                .ticket {
                    width: 100%;
                    max-width: 300px; /* Lebar maksimal menyerupai struk kasir */
                    margin: 0 auto;   /* Posisikan di tengah jika diprint di kertas besar */
                }
                
                .text-center { text-align: center; }
                .fw-bold { font-weight: bold; }
                .border-dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
                .d-flex { display: flex; justify-content: space-between; margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <div class="text-center">
                    <h2 style="margin: 0 0 5px 0;">TOKO PROSPERA</h2>
                    <div>Jl. Universitas Mikroskil, Medan</div>
                    <div>Telp: 0812-3456-7890</div>
                </div>
                <div class="border-dashed"></div>
                <div>
                    <div class="d-flex"><span>Tgl:</span> <span>${escapeHtml(date)}</span></div>
                    <div class="d-flex"><span>Tipe:</span> <span>${escapeHtml(typeLabel)}</span></div>
                </div>
                <div class="border-dashed"></div>
                <div>
                    ${items.map(item => {
                        const name = isFromHistory ? item.Product?.product_name : item.product_name;
                        const qty = item.quantity;
                        const price = isFromHistory ? item.selling_price : item.hargaJual;
                        const subtotal = isFromHistory ? item.sub_total : (qty * price);
                        return `
                        <div style="margin-bottom: 8px;">
                            <div class="fw-bold">${escapeHtml(name || '-')}</div>
                            <div class="d-flex">
                                <span>${escapeHtml(qty)} x Rp${escapeHtml(price)}</span>
                                <span>Rp${escapeHtml(subtotal)}</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="border-dashed"></div>
                <div class="d-flex fw-bold" style="font-size: 14px;">
                    <span>TOTAL</span>
                    <span>Rp${escapeHtml(total)}</span>
                </div>
                <div class="border-dashed"></div>
                <div class="text-center" style="margin-top: 15px;">
                    <div>Terima Kasih Atas Kunjungan Anda!</div>
                    <div style="font-size: 10px; margin-top: 5px;">Powered by Prospera POS</div>
                </div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Timeout dinaikkan sedikit (500ms) agar browser punya cukup waktu
    // merender CSS sebelum layar Print muncul
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};