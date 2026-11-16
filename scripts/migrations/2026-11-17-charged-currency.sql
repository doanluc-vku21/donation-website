-- Authorized target: Supabase project tykwnwjmokbdnkqszqrh only.
-- Lets `donations.charged_currency` store every currency the site sells, so a
-- donation keeps the currency the donor actually paid instead of degrading to
-- a USD-normalized figure.
--
-- Why this exists: the donations table only accepts part of the catalogue in
-- the charged_* columns. A paid Checkout Session in SGD, HKD, NZD, NOK, DKK,
-- TRY or DZD failed the insert, so the gift never appeared on the campaign
-- page. The app now retries such writes without the currency detail, and the
-- reconciliation cron restores it once the constraint allows the value.
--
-- Idempotent: safe to run more than once.
-- Run in the confirmed project's SQL Editor with administrator access.

BEGIN;

-- 1) Show what is currently blocking the column (read-only, for the record).
DO $inspect$
DECLARE
  column_type text;
  constraint_def text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO column_type
    FROM pg_attribute a
   WHERE a.attrelid = 'public.donations'::regclass
     AND a.attname = 'charged_currency'
     AND NOT a.attisdropped;

  RAISE NOTICE 'donations.charged_currency type: %', column_type;

  FOR constraint_def IN
    SELECT pg_get_constraintdef(oid)
      FROM pg_constraint
     WHERE conrelid = 'public.donations'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%charged_currency%'
  LOOP
    RAISE NOTICE 'existing constraint mentions charged_currency: %', constraint_def;
  END LOOP;
END
$inspect$;

-- 2) Widen the exponent scale used for exchange rates so no currency's rate
--    can overflow while being stored.
ALTER TABLE public.donations
  ALTER COLUMN usd_exchange_rate TYPE numeric(18, 8);

-- 3) Drop every CHECK constraint that restricts charged_currency.
DO $drop_checks$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.donations'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%charged_currency%'
  LOOP
    EXECUTE format('ALTER TABLE public.donations DROP CONSTRAINT %I', target.conname);
    RAISE NOTICE 'dropped constraint %', target.conname;
  END LOOP;
END
$drop_checks$;

-- 4) If the column is an enum, add every currency the picker can sell.
DO $widen_enum$
DECLARE
  column_type text;
  code text;
  catalogue text[] := ARRAY[
    'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN',
    'BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL',
    'BSD','BTN','BWP','BYN','BZD','CAD','CDF','CHF','CLP','CNY',
    'COP','CRC','CUP','CVE','CZK','DJF','DKK','DOP','DZD','EGP',
    'ERN','ETB','EUR','FJD','FKP','GBP','GEL','GHS','GIP','GMD',
    'GNF','GTQ','GYD','HKD','HNL','HTG','HUF','IDR','ILS','INR',
    'IQD','IRR','ISK','JMD','JOD','JPY','KES','KGS','KHR','KMF',
    'KRW','KWD','KYD','KZT','LAK','LBP','LKR','LRD','LSL','LYD',
    'MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR',
    'MWK','MXN','MYR','MZN','NAD','NGN','NIO','NOK','NPR','NZD',
    'OMR','PAB','PEN','PGK','PHP','PKR','PLN','PYG','QAR','RON',
    'RSD','RUB','RWF','SAR','SBD','SCR','SDG','SEK','SGD','SHP',
    'SLE','SOS','SRD','STD','SVC','SZL','THB','TJS','TMT','TND',
    'TOP','TRY','TTD','TWD','TZS','UAH','UGX','USD','UYU','UZS',
    'VES','VND','VUV','WST','XAF','XCD','XOF','XPF','YER','ZAR',
    'ZMW'
  ];
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO column_type
    FROM pg_attribute a
   WHERE a.attrelid = 'public.donations'::regclass
     AND a.attname = 'charged_currency'
     AND NOT a.attisdropped;

  IF EXISTS (
    SELECT 1
      FROM pg_attribute a
      JOIN pg_type t ON t.oid = a.atttypid
     WHERE a.attrelid = 'public.donations'::regclass
       AND a.attname = 'charged_currency'
       AND t.typtype = 'e'
  ) THEN
    FOREACH code IN ARRAY catalogue LOOP
      EXECUTE format('ALTER TYPE %s ADD VALUE IF NOT EXISTS %L', column_type, code);
    END LOOP;
    RAISE NOTICE 'added missing currency values to enum %', column_type;
  END IF;
END
$widen_enum$;

-- 5) Re-create a permissive guard for plain text columns: three uppercase
--    letters or NULL. Enum columns are already constrained by their type.
DO $guard$
DECLARE
  column_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod)
    INTO column_type
    FROM pg_attribute a
   WHERE a.attrelid = 'public.donations'::regclass
     AND a.attname = 'charged_currency'
     AND NOT a.attisdropped;

  IF column_type LIKE 'character%' THEN
    ALTER TABLE public.donations
      DROP CONSTRAINT IF EXISTS donations_charged_currency_shape;
    ALTER TABLE public.donations
      ADD CONSTRAINT donations_charged_currency_shape
      CHECK (charged_currency IS NULL OR charged_currency ~ '^[A-Z]{3}$');
    RAISE NOTICE 'installed three-letter guard on %', column_type;
  ELSE
    RAISE NOTICE 'left % to its own type guard', column_type;
  END IF;
END
$guard$;

COMMIT;

-- 6) Verify: every row that lost its currency should be resolvable by the
--    reconciliation cron (runs every 15 minutes) within one window.
SELECT
  charged_currency,
  count(*) AS donations,
  min(created_at) AS oldest,
  max(created_at) AS newest
FROM public.donations
WHERE created_at > now() - interval '7 days'
GROUP BY charged_currency
ORDER BY donations DESC;
