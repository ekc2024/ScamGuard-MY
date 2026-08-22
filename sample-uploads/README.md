# 📄 Sample Uploads — VendorGuard AI

Upload your own PDF documents here to test the VendorGuard AI pipeline.

## How to Upload

1. Go to this folder on GitHub: [sample-uploads/](https://github.com/ekc2024/ScamGuard-MY/tree/main/sample-uploads)
2. Click **"Add file"** → **"Upload files"**
3. Drag and drop your PDF files (invoices, purchase orders, receipts, etc.)
4. Click **"Commit changes"**

## Then Run the Notebook

1. Open the [VendorGuard AI notebook in Colab](https://colab.research.google.com/github/ekc2024/ScamGuard-MY/blob/main/credit-analyzer-v3-production/credit-analyzer-complete/VendorGuard_AI_AP_Automation.ipynb)
2. Run **Steps 1–3** (install dependencies, generate samples, load engine)
3. Run **Step 4** to see the demo with sample data
4. Run **Step 5** — it will automatically download your PDFs from this folder and process them

## Supported Document Types

The pipeline can classify and process:
- Supplier profiles
- Purchase orders
- Tax invoices (original and reissued)
- Delivery orders
- Payment receipts
- Any other AP-related PDF documents

## Notes

- Only `.pdf` files in this folder will be processed
- Files are downloaded fresh each time you run Step 5
- The pipeline processes all PDFs as a single batch
- You can upload as many documents as needed
