import type * as XLSX from 'xlsx-js-style';
import {
  COMPANY_CONTACT,
  COMPANY_LOGO_SRC,
  COMPANY_BRAND_NAME,
  COMPANY_NAME,
  COMPANY_TAGLINE,
} from '@/lib/invoice-branding';

interface ExportColumn<T> {
  header: string;
  value: (row: T, index: number) => string | number | null | undefined;
  // Style conditionnel pour la cellule (permet de colorier en rouge/vert, etc.)
  cellStyle?: (row: T, index: number) => 'positive' | 'negative' | 'neutral' | undefined;
}

interface ExportOptions<T> {
  title: string;
  fileName: string;
  sheetName?: string;
  filtersDescription?: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

type XlsxModule = typeof XLSX;

export async function exportToExcel<T>(options: ExportOptions<T>) {
  const XLSX = await import('xlsx-js-style');
  const { title, fileName, sheetName = 'Données', filtersDescription, columns, rows } = options;

  const data: (string | number)[][] = [];

  // Première ligne : titre
  data.push([title]);

  // Deuxième ligne : filtres, si présents
  if (filtersDescription) {
    data.push([filtersDescription]);
  }

  // Ligne vide de séparation
  data.push([]);

  // En‑têtes
  data.push(columns.map((c) => c.header));

  // Lignes de données
  rows.forEach((row, index) => {
    data.push(
      columns.map((c) => {
        const value = c.value(row, index);
        if (value == null) return '';
        return typeof value === 'number' || typeof value === 'string'
          ? value
          : String(value);
      }),
    );
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  styleExcelWorksheet(XLSX, worksheet, {
    columnCount: columns.length,
    rowCount: data.length,
    headerRowIndex: filtersDescription ? 3 : 2,
    columns,
    rows,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

function styleExcelWorksheet<T>(
  XLSX: XlsxModule,
  worksheet: XLSX.WorkSheet,
  config: {
    columnCount: number;
    rowCount: number;
    headerRowIndex: number;
    columns: ExportColumn<T>[];
    rows: T[];
  },
) {
  const { columnCount, rowCount, headerRowIndex, columns, rows } = config;
  if (columnCount === 0 || rowCount === 0) return;

  const lastCol = columnCount - 1;
  const titleRow = 0;
  const filtersRow = headerRowIndex === 3 ? 1 : undefined;
  const firstDataRow = headerRowIndex + 1;

  worksheet['!merges'] = [
    { s: { r: titleRow, c: 0 }, e: { r: titleRow, c: lastCol } },
    ...(filtersRow !== undefined
      ? [{ s: { r: filtersRow, c: 0 }, e: { r: filtersRow, c: lastCol } }]
      : []),
  ];

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: Math.max(headerRowIndex, rowCount - 1), c: lastCol },
    }),
  };

  worksheet['!cols'] = columns.map((column, index) => {
    const values = rows.map((row, rowIndex) => String(column.value(row, rowIndex) ?? ''));
    const maxLength = Math.max(column.header.length, ...values.map((value) => value.length));
    return { wch: Math.min(Math.max(maxLength + 3, index === 0 ? 16 : 12), 42) };
  });

  const border = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  };

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: '1E3A8A' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'EAF1FF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border,
  };

  const filtersStyle = {
    font: { italic: true, color: { rgb: '92400E' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF7E6' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border,
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '1E3A8A' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border,
  };

  const oddRowStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
    alignment: { vertical: 'center', wrapText: true },
    border,
  };

  const evenRowStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
    alignment: { vertical: 'center', wrapText: true },
    border,
  };

  worksheet['!rows'] = Array.from({ length: rowCount }, (_, index) => ({
    hpt: index === titleRow ? 24 : index === headerRowIndex ? 22 : 18,
  }));

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < columnCount; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      if (!worksheet[address]) {
        worksheet[address] = { t: 's', v: '' };
      }

      if (row === titleRow) {
        worksheet[address].s = titleStyle;
      } else if (row === filtersRow) {
        worksheet[address].s = filtersStyle;
      } else if (row === headerRowIndex) {
        worksheet[address].s = headerStyle;
      } else if (row >= firstDataRow) {
        const dataIndex = row - firstDataRow;
        const cellStyle = columns[col].cellStyle?.(rows[dataIndex], dataIndex);
        worksheet[address].s = {
          ...(dataIndex % 2 === 0 ? evenRowStyle : oddRowStyle),
          ...getExcelConditionalStyle(cellStyle),
        };
      } else {
        worksheet[address].s = {
          fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
          border,
        };
      }
    }
  }
}

function getExcelConditionalStyle(style?: 'positive' | 'negative' | 'neutral') {
  if (style === 'positive') {
    return {
      font: { bold: true, color: { rgb: '166534' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
    };
  }
  if (style === 'negative') {
    return {
      font: { bold: true, color: { rgb: '991B1B' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
    };
  }
  if (style === 'neutral') {
    return {
      font: { bold: true, color: { rgb: '374151' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } },
    };
  }
  return {};
}

// Interface pour les totaux à afficher dans l'export
export interface ExportTotal {
  label: string;
  value: string | number;
  style?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

/** En-tête entreprise (logo + nom) pour les exports PDF */
export interface PDFBranding {
  companyName: string;
  tagline?: string;
  /** Sous-titre du document (ex. type d’export) */
  documentLabel?: string;
}

export interface PDFExportOptions<T> extends ExportOptions<T> {
  headerColor?: string; // Couleur de fond de l'en-tête (défaut: bleu)
  headerTextColor?: string; // Couleur du texte de l'en-tête (défaut: blanc)
  evenRowColor?: string; // Couleur des lignes paires (défaut: gris clair)
  oddRowColor?: string; // Couleur des lignes impaires (défaut: blanc)
  accentColor?: string; // Couleur d'accent pour le titre (défaut: bleu)
  totals?: ExportTotal[]; // Totaux à afficher en bas du tableau
  branding?: PDFBranding;
  /** Masque le bloc « Total enregistrements » (utile quand les totaux détaillés suffisent) */
  hideDefaultStatBox?: boolean;
}

export function exportToPrintablePDF<T>(options: ExportOptions<T> | PDFExportOptions<T>) {
  const { title, filtersDescription, columns, rows } = options;
  
  // Couleurs par défaut ou personnalisées
  const pdfOptions = options as PDFExportOptions<T>;
  const headerColor = pdfOptions.headerColor || '#1e3a8a'; // Bleu marine TLR
  const headerTextColor = pdfOptions.headerTextColor || '#ffffff'; // Blanc
  const evenRowColor = pdfOptions.evenRowColor || '#f8fafc'; // Gris très clair
  const oddRowColor = pdfOptions.oddRowColor || '#ffffff'; // Blanc
  const accentColor = pdfOptions.accentColor || '#1e3a8a'; // Bleu marine TLR
  const totals = pdfOptions.totals || [];
  const branding = pdfOptions.branding || {
    companyName: COMPANY_NAME,
    tagline: COMPANY_TAGLINE,
    documentLabel: 'Export officiel',
  };
  const hideDefaultStatBox = pdfOptions.hideDefaultStatBox === true;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tableHeaders = columns
    .map((c) => `<th>${c.header}</th>`)
    .join('');

  const tableRows = rows
    .map((row, index) => {
      const rowColor = index % 2 === 0 ? evenRowColor : oddRowColor;
      const cells = columns
        .map((c) => {
          const value = c.value(row, index);
          const cellStyle = c.cellStyle ? c.cellStyle(row, index) : undefined;
          
          // Appliquer les styles conditionnels (vert pour positif, rouge pour négatif)
          let styleAttr = '';
          if (cellStyle === 'positive') {
            styleAttr = 'style="color: #166534; font-weight: 600; background-color: rgba(34, 197, 94, 0.1);"';
          } else if (cellStyle === 'negative') {
            styleAttr = 'style="color: #991b1b; font-weight: 600; background-color: rgba(239, 68, 68, 0.1);"';
          }
          
          return `<td ${styleAttr}>${value ?? ''}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${rowColor};">${cells}</tr>`;
    })
    .join('');

  const filtersBlock = filtersDescription
    ? `<div class="filters-box">${filtersDescription}</div>`
    : '';

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <title>${title}</title>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 24px;
            color: #111827;
            background: #fff;
            margin: 0;
          }
          .pdf-brand {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-bottom: 22px;
            padding: 18px 20px;
            background:
              linear-gradient(135deg, rgba(30,58,138,0.08) 0%, rgba(122,31,43,0.06) 100%),
              #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            border-top: 4px solid #1e3a8a;
          }
          .pdf-brand-logo {
            flex-shrink: 0;
            width: 92px;
            height: 64px;
            border-radius: 12px;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            border: 1px solid #dbe4f0;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
          }
          .pdf-brand-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .pdf-brand-name {
            font-size: 20px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.03em;
            line-height: 1.2;
          }
          .pdf-brand-tagline {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .pdf-brand-contact {
            font-size: 11px;
            color: #475569;
            margin-top: 5px;
            line-height: 1.45;
          }
          .pdf-brand-doc {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #7a1f2b;
            font-weight: 700;
            margin-top: 8px;
          }
          .header {
            border-bottom: 3px solid #7a1f2b;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 22px;
            margin: 0 0 8px 0;
            color: ${accentColor};
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          .date {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
          }
          .filters-box {
            background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #92400e;
          }
          .filters-box::before {
            content: "🔍 ";
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          thead {
            background: linear-gradient(135deg, ${headerColor} 0%, ${adjustColor(headerColor, -20)} 100%);
          }
          thead th {
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: ${headerTextColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: none;
          }
          tbody td {
            padding: 10px;
            font-size: 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          tbody tr:hover {
            background-color: #eaf1ff !important;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
          }
          .stat-box {
            background: linear-gradient(135deg, #f8fafc 0%, #eaf1ff 100%);
            border: 1px solid #1e3a8a;
            border-radius: 8px;
            padding: 12px 20px;
            text-align: center;
          }
          .stat-box.primary {
            background: linear-gradient(135deg, #eaf1ff 0%, #dbeafe 100%);
            border-color: ${accentColor};
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: ${accentColor};
          }
          .stat-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
          }
          .totals-section {
            margin-top: 24px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #fff7ed 100%);
            border-radius: 12px;
            border: 2px solid #1e3a8a;
          }
          .totals-title {
            font-size: 14px;
            font-weight: 700;
            color: ${accentColor};
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          .total-item {
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .total-item.positive {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border: 1px solid #22c55e;
          }
          .total-item.negative {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border: 1px solid #ef4444;
          }
          .total-item.neutral {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 1px solid #9ca3af;
          }
          .total-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .total-value {
            font-size: 20px;
            font-weight: 700;
          }
          .total-item.positive .total-value {
            color: #166534;
          }
          .total-item.negative .total-value {
            color: #991b1b;
          }
          .total-item.neutral .total-value {
            color: #374151;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
            tbody tr:hover {
              background-color: inherit !important;
            }
          }
        </style>
      </head>
      <body>
        ${branding ? `
        <div class="pdf-brand">
          <div class="pdf-brand-logo"><img src="${COMPANY_LOGO_SRC}" alt="${COMPANY_NAME}" /></div>
          <div>
            <div class="pdf-brand-name">${branding.companyName}</div>
            ${branding.tagline ? `<div class="pdf-brand-tagline">${branding.tagline}</div>` : ''}
            <div class="pdf-brand-contact">${COMPANY_CONTACT}</div>
            ${branding.documentLabel ? `<div class="pdf-brand-doc">${branding.documentLabel}</div>` : ''}
          </div>
        </div>
        ` : ''}
        <div class="header">
          <h1>${title}</h1>
          <p class="date">Document généré le ${currentDate}</p>
        </div>
        ${!hideDefaultStatBox ? `
        <div class="stats">
          <div class="stat-box primary">
            <div class="stat-value">${rows.length}</div>
            <div class="stat-label">Lignes exportées</div>
          </div>
        </div>
        ` : ''}
        ${filtersBlock}
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        ${totals.length > 0 ? `
        <div class="totals-section">
          <div class="totals-title">📊 RÉCAPITULATIF DES TOTAUX</div>
          <div class="totals-grid">
            ${totals.map(t => `
              <div class="total-item ${t.style || 'neutral'}">
                <div class="total-label">${t.icon || ''} ${t.label}</div>
                <div class="total-value">${t.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        <div class="footer">
          Document généré automatiquement par ${COMPANY_BRAND_NAME} • ${currentDate}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

// Fonction utilitaire pour ajuster la luminosité d'une couleur hexadécimale
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}


