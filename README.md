# CommissionPH — Real Estate Commission Take-Home Calculator (PH brokers, free + PRO ₱149)

**Live:** https://makavelimachiavelli.github.io/commissionph/

## What it is
"Magkano talaga ang dadaan sa GCash mo?" — commission stack ng PH broker: gross (3–6% presets) → referral fee → co-broke split (50/50 standard presets) → broker-of-record/company cut → NET → 5% BIR 2307 creditable withholding → CASH IN HAND, with VAT note for VAT-registered brokers (billing +12%, remitted — net unchanged) and the 2307-credit education line linking TaxCalcPH. PRO ₱149: deal tracker (per-deal net + 2307 credits + annual totals) + CSV.

## Persona & demand
PH licensed brokers/agents (PRC), GCash-native, co-broke culture. Paid comparators: ComCal (App Store, paid w/ PDF export), Estate Agent Calculator Pro (Play, Pro), Brokermint spreadsheet+app = 3+ paid; the free field (DocJacket/Hauseit) is US-generic with no co-broke/2307/VAT-PH stack — that's the wedge.

## Verification
26/26 jsdom assertions (splits math, VAT invariance, 2307 toggle, rate presets, tracker gate→PRO→CRUD→totals, CSV, persistence). Suite caught a real scope bug (module-level addToTracker calling callback-scoped openPay) pre-deploy.

## Deploy
`../toolkit/deploy-pages.sh . commissionph`
