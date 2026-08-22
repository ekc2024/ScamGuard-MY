# 📄 Sample Uploads — VendorGuard AI

Upload your own documents here to test the VendorGuard AI pipeline.

## Supported File Types

| Format | Extensions | Use For |
|--------|-----------|---------|
| **PDF** | `.pdf` | Invoices, POs, receipts, delivery orders, supplier profiles |
| **Excel** | `.xlsx`, `.xls` | Transaction logs, payment records, vendor lists, AP aging reports |

## How to Upload

1. Go to this folder on GitHub: [sample-uploads/](https://github.com/ekc2024/ScamGuard-MY/tree/main/sample-uploads)
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop your PDF and/or Excel files
4. Click **"Commit changes"**

## Three Ways to Analyze Your Documents

| Method | Where | Best For |
|--------|-------|----------|
| **Step 5** — GitHub Upload | Upload here, run notebook | Team collaboration, persistent storage |
| **Step 6B** — Google Drive | Mount Drive in Colab | Large file sets, recurring analysis |
| **Step 6C** — Direct Upload | Colab file picker | Quick one-off testing |

## Then Run the Notebook

1. Open the [VendorGuard AI notebook in Colab](https://colab.research.google.com/github/ekc2024/ScamGuard-MY/blob/main/credit-analyzer-v3-production/credit-analyzer-complete/VendorGuard_AI_AP_Automation.ipynb)
2. Run **Steps 1–3** (install dependencies, generate samples, load engine)
3. Run **Step 4** to see the demo with sample data
4. Run **Step 5** to process PDFs from this GitHub folder
5. Run **Step 6** for additional upload options (Google Drive or direct upload)

## What the Pipeline Does with Your Files

### PDF Documents
Full 8-step automation pipeline:
1. Batch ingest with SHA-256 hashing
2. Document type classification
3. Field extraction & normalization (ISO dates, MYR, masked accounts)
4. Supplier identity resolution
5. Cross-document linking
6. Deterministic control checks
7. Weighted risk scoring
8. Human review dashboard

### Excel Files
Quick analysis including:
- Sheet and column detection
- Data preview
- Financial column identification
- Duplicate entry detection
- Row count summary

## Notes

- PDF files get full pipeline processing with risk scoring
- Excel files get quick-scan analysis with previews
- Files are downloaded fresh each time you run the notebook
- The pipeline processes all PDFs as a single batch
- Bank accounts are automatically masked (PDPA compliance)
