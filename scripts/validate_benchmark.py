from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "benchmark"


def rows(name: str):
    with (DATA / name).open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def fail(msg: str):
    raise SystemExit(f"BENCHMARK VALIDATION FAILED: {msg}")


products = rows("01_products.csv")
materials = rows("02_materials.csv")
bom = rows("06_bom.csv")
operations = rows("07_operations.csv")
stock = rows("05_initial_stock.csv")
sales = rows("08_sales_orders.csv")
mos = rows("09_manufacturing_orders.csv")
pos = rows("10_purchase_orders.csv")

if len(products) != 6:
    fail(f"expected 6 products, got {len(products)}")
if len(materials) != 13:
    fail(f"expected 13 materials, got {len(materials)}")

product_skus = {r["SKU"] for r in products}
material_skus = {r["SKU"] for r in materials}
all_skus = product_skus | material_skus
if len(all_skus) != 19:
    fail(f"expected 19 unique SKUs, got {len(all_skus)}")
if product_skus & material_skus:
    fail("product/material SKU collision")

for r in bom:
    parent = r["Product variant code / SKU"]
    child = r["Ingredient variant code / SKU"]
    if parent not in product_skus:
        fail(f"BOM parent missing from products: {parent}")
    if child not in all_skus:
        fail(f"BOM ingredient missing: {child}")
    if float(r["Quantity"]) <= 0:
        fail(f"non-positive BOM quantity for {parent} -> {child}")

for r in operations:
    if r["Product variant code / SKU"] not in product_skus:
        fail(f"operation references missing product: {r['Product variant code / SKU']}")

for r in stock:
    if r["SKU"] not in all_skus:
        fail(f"stock references missing SKU: {r['SKU']}")

for r in sales:
    if r["SKU"] not in product_skus:
        fail(f"sales order references non-product SKU: {r['SKU']}")
for r in mos:
    if r["SKU"] not in product_skus:
        fail(f"manufacturing order references non-product SKU: {r['SKU']}")
for r in pos:
    if r["SKU"] not in material_skus:
        fail(f"purchase order references non-material SKU: {r['SKU']}")

tracking = {r["SKU"]: r["Tracking"] for r in products}
if tracking.get("FG-CBOX-CST") != "Serial":
    fail("control box must remain serial tracked")
if tracking.get("FG-CLEAN-1L") != "Batch/Lot":
    fail("cleaning concentrate must remain batch/lot tracked")

print("Benchmark V1 validation PASS")
print(f"Products: {len(products)} | Materials: {len(materials)} | Total SKUs: {len(all_skus)}")
print(f"BOM rows: {len(bom)} | Operations: {len(operations)}")
