import requests, pandas as pd, pypdf, io

# 1. Create a sample Excel file in memory
df = pd.DataFrame({
    'Batch_ID': ['B101', 'B102', 'B103', 'B104'],
    'Product': ['Cotton_40s', 'Cotton_30s', 'Denim_12oz', 'Viscose_30s'],
    'Defect_Rate_Pct': [1.2, 3.8, 0.9, 4.5],
    'Inspection_Points': [14, 38, 11, 46],
    'Status': ['PASS', 'REJECT', 'PASS', 'REJECT']
})
excel_buf = io.BytesIO()
df.to_excel(excel_buf, index=False)
excel_buf.seek(0)

# Test Excel Upload
r_excel = requests.post(
    'http://localhost:5000/api/upload',
    files={'file': ('production_batch_report.xlsx', excel_buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
)
print('Excel Upload Status:', r_excel.status_code)
res_excel = r_excel.json()
print('Excel Summary:', res_excel.get('display_summary'))
print('Excel Text Preview (first 300 chars):')
print(res_excel.get('text_content', '')[:300])

# 2. Test PDF Creation & Upload in memory
writer = pypdf.PdfWriter()
page = writer.add_blank_page(width=612, height=792)
pdf_buf = io.BytesIO()
writer.write(pdf_buf)
pdf_buf.seek(0)

r_pdf = requests.post(
    'http://localhost:5000/api/upload',
    files={'file': ('audit_spec_sheet.pdf', pdf_buf, 'application/pdf')}
)
print('\nPDF Upload Status:', r_pdf.status_code)
print('PDF Summary:', r_pdf.json().get('display_summary'))
