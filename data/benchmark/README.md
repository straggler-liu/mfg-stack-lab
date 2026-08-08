# MFG Stack Lab Standard Manufacturing Benchmark V1.0

## Baseline
- 19 total SKUs: 3 finished goods, 3 subassemblies, 10 raw materials, 3 packaging items.
- 1 baseline location: `Main`.
- Three manufacturing modes: make-to-stock, make-to-order, batch.
- Traceability: serial numbers and batch/lot.
- Integrations are NOT connected during the baseline run.

## Katana sequence
1. Delete Katana preloaded Demo data. Confirm `0/30 items in use`.
2. Settings → Assisted import.
3. Import `01_products.csv`.
4. Import `02_materials.csv`.
5. Import suppliers/customers/stock.
6. Import `06_bom.csv` only after all items exist.
7. Import operations with Katana's operation importer if Assisted Import does not support the mapping.
8. Do not create sales/manufacturing/purchase orders until baseline master data has been verified.

## Evidence rule
Use Test Case IDs `TC01`–`TC36` in screenshots and notes. A claim cannot enter a public review without evidence.
