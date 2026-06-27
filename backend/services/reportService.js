const ExcelJS = require('exceljs');

class BaseReport {
    constructor(reportData, res, isOwner) {
        this.summary = reportData.summary;
        this.breakdown = reportData.status_breakdown;
        this.details = reportData.details;
        this.res = res;
        this.isOwner = isOwner;
    }

    // Hapus formatRupiah karena kita sekarang mengirim raw integer dan menggunakan format native Excel

    // Fungsi untuk sanitize injeksi CSV (CWE-1236)
    sanitizeCSV(val) {
        if (typeof val === 'string' && /^[=+\-@]/.test(val)) {
            return `'${val}`;
        }
        return val;
    }
}

class ExcelReport extends BaseReport {
    async generate() {
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ 
            stream: this.res,
            useStyles: true,
            useSharedStrings: true
        });
        const headerRowIndex = this.isOwner ? 14 : 13;
        const sheet = workbook.addWorksheet('Laporan Prospera', {
            views: [{ state: 'frozen', ySplit: headerRowIndex, xSplit: 0 }]
        });

        sheet.getColumn('A').width = 30; // Nama Produk
        sheet.getColumn('B').width = 20; // Kategori
        sheet.getColumn('C').width = 15; // Sisa Stok
        sheet.getColumn('D').width = 28; // Tanggal Kedaluwarsa (Diperlebar agar tidak kepotong)
        sheet.getColumn('E').width = 18; // Status AI Restock
        sheet.getColumn('F').width = 12; // Terjual
        sheet.getColumn('G').width = 18; // Harga Satuan
        sheet.getColumn('H').width = 18; // Subtotal
        
        const currencyFormat = '"Rp"#,##0;[Red]\\-"Rp"#,##0';

        if (this.isOwner) {
            sheet.getColumn('I').width = 18; // Profit (Rp)
            sheet.getColumn('J').width = 15; // Margin (%)
        }

        // Freeze Panes sudah dideklarasikan di awal saat addWorksheet

        let rowIndex = 1;

        // Helper untuk menulis baris dengan aman di mode Streaming
        const writeRow = (values, styler = null) => {
            const row = sheet.getRow(rowIndex++);
            row.values = values;
            if (styler) styler(row);
            row.commit();
        };

        //HEADER & SUMMARY
        writeRow(['LAPORAN PENJUALAN PROSPERA'], (row) => { row.font = { bold: true, size: 14 }; });
        writeRow([]); 
        
        writeRow(['RINGKASAN'], (row) => { row.font = { bold: true }; });
        writeRow(['Total Transaksi', Number(this.summary.total_transaction) || 0]);
        writeRow(['Produk Terjual', Number(this.summary.items_sold) || 0]);
        
        writeRow(['Total Omzet', Number(this.summary.revenue) || 0], (row) => {
            row.getCell(2).style = { numFmt: '[$Rp-421]#,##0' };
        });
        
        if (this.isOwner) {
            writeRow(['Total Profit', Number(this.summary.total_profit) || 0], (row) => {
                row.getCell(2).style = { numFmt: '[$Rp-421]#,##0' };
            });
        }
        writeRow([]);

        //STATUS BREAKDOWN
        writeRow(['STATUS TRANSAKSI'], (row) => { row.font = { bold: true }; });
        writeRow(['Sukses', this.breakdown.success]);
        writeRow(['Dibatalkan', this.breakdown.cancelled]);
        writeRow([]);

        //TABEL DETAIL PRODUK
        writeRow(['RINCIAN ANALISIS PRODUK'], (row) => { row.font = { bold: true }; });
        
        const headers = [
            'Nama Produk', 
            'Kategori',
            'Sisa Stok Saat Ini',
            'Tanggal Kedaluwarsa Terdekat',
            'Status AI Restock',
            'Terjual', 
            'Harga Satuan', 
            'Subtotal'
        ];

        if (this.isOwner) {
            headers.push('Profit (Rp)', 'Margin (%)');
        }

        writeRow(headers, (row) => {
            row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } }; // Biru Elegan
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        // Isi Data
        if (this.details && this.details.length > 0) {
            this.details.forEach(item => {
                const rowData = [
                    this.sanitizeCSV(item.name),
                    this.sanitizeCSV(item.category),
                    item.current_stock,
                    item.expired_date,
                    item.ai_status,
                    Number(item.qty) || 0,
                    Number(item.unitPrice) || 0, // raw integer
                    Number(item.subtotal) || 0   // raw integer
                ];

                if (this.isOwner) {
                    const marginDec = parseFloat(item.margin.replace('%', '')) / 100;
                    rowData.push(Number(item.profit) || 0, isNaN(marginDec) ? 0 : Number(marginDec));
                }

                writeRow(rowData, (row) => {
                    const simpleCurrencyFormat = '[$Rp-421]#,##0';
                    row.getCell(7).style = { numFmt: simpleCurrencyFormat };
                    row.getCell(8).style = { numFmt: simpleCurrencyFormat };
                    if (this.isOwner) {
                        row.getCell(9).style = { numFmt: simpleCurrencyFormat };
                        row.getCell(10).style = { numFmt: '0.0%', alignment: { horizontal: 'center' } };
                    }
                });
            });
        } else {
            writeRow(['Tidak ada produk terjual']);
        }

        sheet.commit();
        await workbook.commit();
        this.res.end();
    }
}


class CsvReport extends BaseReport {
    async generate() {
        // Tulis BOM ke response secara manual untuk CSV
        this.res.write('\uFEFF');

        // Fungsi manual untuk memformat CSV dan streaming baris per baris
        const escapeCSV = (field) => {
            if (field === null || field === undefined) return '';
            const str = String(field);
            if (str.includes(';') || str.includes('\n') || str.includes('"')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const writeRow = (rowArray) => {
            const rowString = rowArray.map(escapeCSV).join(';') + '\n';
            this.res.write(rowString);
        };

        // Sinkronisasi: Header dan Summary agar mirip dengan format Excel
        writeRow(['LAPORAN PENJUALAN PROSPERA']);
        writeRow([]);
        writeRow(['RINGKASAN']);
        writeRow(['Total Transaksi', Number(this.summary.total_transaction) || 0]);
        writeRow(['Produk Terjual', Number(this.summary.items_sold) || 0]);
        writeRow(['Total Omzet', Number(this.summary.revenue) || 0]);
        if (this.isOwner) {
            writeRow(['Total Profit', Number(this.summary.total_profit) || 0]);
        }
        writeRow([]);
        
        writeRow(['STATUS TRANSAKSI']);
        writeRow(['Sukses', this.breakdown.success]);
        writeRow(['Dibatalkan', this.breakdown.cancelled]);
        writeRow([]);
        
        writeRow(['RINCIAN ANALISIS PRODUK']);
        
        // Header CSV Tabel
        const headers = [
            'Nama Produk', 
            'Kategori',
            'Sisa Stok Saat Ini',
            'Tanggal Kedaluwarsa Terdekat',
            'Status AI Restock',
            'Terjual', 
            'Harga Satuan', 
            'Subtotal'
        ];
        if (this.isOwner) {
            headers.push('Profit', 'Margin (%)');
        }
        writeRow(headers);

        // Isi Data 
        if (this.details && this.details.length > 0) {
            this.details.forEach(item => {
                const rowData = [
                    this.sanitizeCSV(item.name),
                    this.sanitizeCSV(item.category),
                    item.current_stock,
                    item.expired_date,
                    item.ai_status,
                    item.qty,
                    item.unitPrice, 
                    item.subtotal
                ];

                if (this.isOwner) {
                    rowData.push(item.profit, item.margin.replace('%', ''));
                }
                
                writeRow(rowData);
            });
        }

        this.res.end();
    }
}

module.exports = { ExcelReport, CsvReport };

