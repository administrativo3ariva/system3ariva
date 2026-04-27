
-- 1) Normalize supplier names: trim and collapse internal whitespace
UPDATE public.expenses
SET supplier = REGEXP_REPLACE(TRIM(supplier), '\s+', ' ', 'g')
WHERE supplier IS NOT NULL AND supplier <> '';

UPDATE public.payment_requests
SET supplier = REGEXP_REPLACE(TRIM(supplier), '\s+', ' ', 'g')
WHERE supplier IS NOT NULL AND supplier <> '';

UPDATE public.recurring_expenses
SET supplier = REGEXP_REPLACE(TRIM(supplier), '\s+', ' ', 'g')
WHERE supplier IS NOT NULL AND supplier <> '';

UPDATE public.operational_expenses
SET supplier = REGEXP_REPLACE(TRIM(supplier), '\s+', ' ', 'g')
WHERE supplier IS NOT NULL AND supplier <> '';

UPDATE public.suppliers
SET name = REGEXP_REPLACE(TRIM(name), '\s+', ' ', 'g')
WHERE name IS NOT NULL;

-- 2) Merge duplicate suppliers (case-insensitive). Keep the oldest row per name.
WITH ranked AS (
  SELECT id, name,
         ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS rn,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS keeper_id,
         FIRST_VALUE(name) OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS keeper_name
  FROM public.suppliers
),
to_remap AS (
  SELECT id AS dup_id, keeper_id, keeper_name FROM ranked WHERE rn > 1
)
UPDATE public.expenses e
SET supplier_id = tr.keeper_id, supplier = tr.keeper_name
FROM to_remap tr
WHERE e.supplier_id = tr.dup_id;

WITH ranked AS (
  SELECT id, name,
         ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS rn,
         FIRST_VALUE(id) OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS keeper_id,
         FIRST_VALUE(name) OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS keeper_name
  FROM public.suppliers
),
to_remap AS (
  SELECT id AS dup_id, keeper_id, keeper_name FROM ranked WHERE rn > 1
)
UPDATE public.payment_requests p
SET supplier_id = tr.keeper_id, supplier = tr.keeper_name
FROM to_remap tr
WHERE p.supplier_id = tr.dup_id;

WITH ranked AS (
  SELECT id, name,
         ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC, id ASC) AS rn
  FROM public.suppliers
)
DELETE FROM public.suppliers WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Auto-create suppliers from existing expenses/payment_requests/recurring/operational rows
-- where the textual name does not yet exist in suppliers (case-insensitive)
INSERT INTO public.suppliers (name)
SELECT DISTINCT s.supplier
FROM (
  SELECT supplier FROM public.expenses WHERE supplier IS NOT NULL AND supplier <> ''
  UNION
  SELECT supplier FROM public.payment_requests WHERE supplier IS NOT NULL AND supplier <> ''
  UNION
  SELECT supplier FROM public.recurring_expenses WHERE supplier IS NOT NULL AND supplier <> ''
  UNION
  SELECT supplier FROM public.operational_expenses WHERE supplier IS NOT NULL AND supplier <> ''
) s
WHERE NOT EXISTS (
  SELECT 1 FROM public.suppliers sup WHERE LOWER(sup.name) = LOWER(s.supplier)
);

-- 4) Backfill supplier_id and unify supplier text on existing rows by case-insensitive match
UPDATE public.expenses e
SET supplier_id = sup.id, supplier = sup.name
FROM public.suppliers sup
WHERE e.supplier IS NOT NULL
  AND e.supplier <> ''
  AND LOWER(e.supplier) = LOWER(sup.name)
  AND (e.supplier_id IS DISTINCT FROM sup.id OR e.supplier <> sup.name);

UPDATE public.payment_requests p
SET supplier_id = sup.id, supplier = sup.name
FROM public.suppliers sup
WHERE p.supplier IS NOT NULL
  AND p.supplier <> ''
  AND LOWER(p.supplier) = LOWER(sup.name)
  AND (p.supplier_id IS DISTINCT FROM sup.id OR p.supplier <> sup.name);
