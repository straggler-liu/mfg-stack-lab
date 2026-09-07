# Decision Engine Missing-Fact Matrix

Status: V2 design input. This document governs what the Decision Engine may ask after public evidence is scanned. It is intentionally short-question-first and evidence-bounded.

## Rule

Ask only facts that can materially change the software-boundary decision, vendor category, implementation risk, or commercial routing. Do not ask for information already supported by current public evidence. Default to 1–2 questions per session.

## Evidence order

1. Public FACT from company website or buyer-supplied material.
2. Buyer-confirmed FACT.
3. INFERENCE, clearly labeled and never promoted to FACT without confirmation.

## Highest-value missing facts

| Missing fact | Ask when | Decision impact | Example concise question |
|---|---|---|---|
| Current system of record | Public evidence does not identify accounting / inventory / MRP / ERP | Determines whether need is add-on, MRP, ERP, or implementation stabilization | “What system currently holds your inventory and production truth—Excel, QuickBooks/Xero, an MRP, or an ERP?” |
| Manufacturing model | Site does not clearly distinguish make-to-stock, make-to-order, engineer-to-order, job shop, batch/process | Changes scheduling, BOM/routing, traceability and costing requirements | “Are most jobs repeat production, make-to-order, engineer-to-order, or batch/process?” |
| Primary operational pain | Several plausible constraints exist | Determines whether category should optimize planning, inventory, job costing, traceability, shop floor, or integration | “Which problem is forcing the decision now: planning, inventory accuracy, job costing, traceability, or system integration?” |
| Decision timing | No current buying signal | Determines QB qualification and whether paid diagnostic is appropriate | “Are you choosing or changing software within 90 days, later this year, or just researching?” |
| Accounting boundary | QuickBooks/Xero or local accounting appears relevant | Determines whether accounting should remain system of record with MRP layered on top | “Do you want to keep your current accounting system, or are you open to replacing it?” |
| Inventory complexity | Public evidence suggests multiple warehouses/SKUs but not operational detail | Distinguishes inventory platform vs MRP/ERP need | “Do you need lot/serial traceability, multi-location inventory, or both?” |
| BOM / routing depth | Product manufacturing evident but process detail absent | Determines lightweight MRP vs more capable manufacturing ERP | “Do products use multi-level BOMs and routings/work centers, or mostly simple assemblies?” |
| Shop-floor scheduling | Capacity-sensitive manufacturing likely | Separates basic inventory/MRP from finite scheduling/APS requirement | “Is capacity scheduling by machine/work center a must-have, or is material planning enough?” |
| Job costing method | Job shop / fabrication / project manufacturing signal present | Changes product fit materially | “Do you need actual labor + material cost by job/work order?” |
| Traceability / compliance | Food, medical, aerospace, chemicals, regulated manufacturing | May eliminate otherwise plausible vendors | “Do you require lot genealogy, recall traceability, certificates, or regulated audit records?” |
| Ecommerce / channel integration | Shopify/Amazon/DTC signal present | Can favor inventory-first stack or specific connectors | “Which sales channels must stay synchronized with manufacturing inventory?” |
| Local statutory/accounting constraints | Buyer country has material tax/accounting/integration differences | Country eligibility gate; may block vendor recommendation | “Which accounting/tax system must the manufacturing stack integrate with in your country?” |

## Boundary tests before vendor names

The engine should first classify the decision boundary:

### Inventory-first
Use when the core problem is stock visibility, purchasing, order synchronization, light assembly/kitting, or ecommerce integration and manufacturing complexity is low.

### MRP-first
Use when BOM explosion, material planning, production orders, routings, basic scheduling, job costing, or shop-floor control is central while full enterprise replacement is unnecessary.

### ERP-first
Use when finance + manufacturing + purchasing + warehousing + multi-entity / advanced controls must share one operating model, or when integration fragmentation itself is the primary constraint.

### Stabilize current ERP
Use when the buyer already owns a capable ERP and the current problem is implementation, data, adoption, configuration, integration, reporting, or process discipline rather than product-category fit.

### Category-level only
Use when country/vendor eligibility, key requirements, or factual evidence is insufficient. Never manufacture a vendor recommendation.

## Commercial gate

A buyer becomes eligible for a paid Deep Diagnostic only when all are true:

- real manufacturer or manufacturing-adjacent operator;
- specific software/process decision exists;
- decision timing is active, normally <=90 days;
- free Initial Decision Map has already delivered useful value;
- unresolved uncertainty remains that is worth deeper work;
- no commercial relationship has altered Fit Score or recommendation order.

## Referral gate

Before any buyer-identifiable vendor referral:

1. Fit Score and recommendation order are already fixed on product fit.
2. Country/product eligibility is current and verified.
3. Buyer explicitly consents to the referral/share.
4. A valid attribution/commercial route exists.
5. Consent and referral events are persisted with idempotent identifiers.

## Non-negotiable evidence boundary

The engine must never imply access to private ERP, CRM, accounting, inbox, employee, portal, or operational data unless the buyer deliberately provides it. Website-derived claims must identify what was actually observed and what remains inferred or unknown.
