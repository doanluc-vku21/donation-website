-- Authorized target: Supabase project tykwnwjmokbdnkqszqrh only.
-- Creates/activates help-street-vendor and initializes its donation options.
-- Retains all other campaigns, donations, permissions and security policies.
-- Run in the confirmed project's SQL Editor with administrator access.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('help-street-vendor-initialization'));
DO $setup$
DECLARE
  target_id uuid;
  target_org text;
  target_goal bigint;
  target_currency text;
BEGIN
  SELECT id, organization_name, goal_amount_cents, currency
    INTO target_id, target_org, target_goal, target_currency
    FROM public.campaigns WHERE slug = 'help-street-vendor';
  IF target_id IS NULL THEN
    INSERT INTO public.campaigns
      (slug, title, organization_name, eyebrow, summary, story,
       goal_amount_cents, currency, is_active)
    SELECT s.slug, s.title, s.organization_name, s.eyebrow, s.summary, s.story,
      s.goal_amount_cents, s.currency, s.is_active
    FROM jsonb_populate_record(NULL::public.campaigns,
      $street_vendor_seed${"slug": "help-street-vendor", "title": "❤️ He Works Hard Every Day to Support His Family. Now It’s Our Turn to Help Him.", "organization_name": "MEAL SUPPORT INC", "eyebrow": "", "summary": "He works hard every day to support his family. Now, we have an opportunity to stand beside him and offer our support.\n\nMeal Support Inc is bringing people together to help him and his family. Your kindness can make a difference.\n\n❤️ Give once or become a monthly supporter to help him and his family look toward the future with hope.", "story": ["He works hard every day to support his family. Now, we have an opportunity to stand beside him and offer our support.", "Meal Support Inc is bringing people together to help him and his family. Your kindness can make a difference.", "❤️ Give once or become a monthly supporter to help him and his family look toward the future with hope."], "goal_amount_cents": 250000, "currency": "USD", "is_active": false}$street_vendor_seed$::jsonb) s
    RETURNING id, organization_name, goal_amount_cents, currency
      INTO target_id, target_org, target_goal, target_currency;
  END IF;
  IF target_org IS DISTINCT FROM 'MEAL SUPPORT INC' OR
     target_goal IS DISTINCT FROM 250000 OR target_currency IS DISTINCT FROM 'USD' THEN
    RAISE EXCEPTION 'Existing street vendor identity or goal differs; initialization stopped';
  END IF;

  INSERT INTO public.donation_options
    (campaign_id, amount_cents, impact_text, featured, sort_order, frequency)
  SELECT target_id, o.amount_cents, o.impact_text, o.featured, o.sort_order, o.frequency
  FROM jsonb_populate_recordset(NULL::public.donation_options,
    $street_vendor_options$[{"frequency": "one_time", "amount_cents": 2500, "impact_text": "", "featured": false, "sort_order": 0}, {"frequency": "one_time", "amount_cents": 5000, "impact_text": "", "featured": true, "sort_order": 1}, {"frequency": "one_time", "amount_cents": 7500, "impact_text": "", "featured": false, "sort_order": 2}, {"frequency": "monthly", "amount_cents": 2500, "impact_text": "", "featured": false, "sort_order": 0}, {"frequency": "monthly", "amount_cents": 5000, "impact_text": "", "featured": true, "sort_order": 1}, {"frequency": "monthly", "amount_cents": 10000, "impact_text": "", "featured": false, "sort_order": 2}]$street_vendor_options$::jsonb) o
  WHERE NOT EXISTS (SELECT 1 FROM public.donation_options n
    WHERE n.campaign_id = target_id AND n.frequency = o.frequency
      AND n.amount_cents = o.amount_cents);

  IF EXISTS (
    SELECT 1 FROM jsonb_populate_recordset(NULL::public.donation_options,
      $street_vendor_options$[{"frequency": "one_time", "amount_cents": 2500, "impact_text": "", "featured": false, "sort_order": 0}, {"frequency": "one_time", "amount_cents": 5000, "impact_text": "", "featured": true, "sort_order": 1}, {"frequency": "one_time", "amount_cents": 7500, "impact_text": "", "featured": false, "sort_order": 2}, {"frequency": "monthly", "amount_cents": 2500, "impact_text": "", "featured": false, "sort_order": 0}, {"frequency": "monthly", "amount_cents": 5000, "impact_text": "", "featured": true, "sort_order": 1}, {"frequency": "monthly", "amount_cents": 10000, "impact_text": "", "featured": false, "sort_order": 2}]$street_vendor_options$::jsonb) o
    WHERE NOT EXISTS (SELECT 1 FROM public.donation_options n
      WHERE n.campaign_id = target_id AND n.frequency = o.frequency
        AND n.amount_cents = o.amount_cents)
  ) THEN
    RAISE EXCEPTION 'Donation options readback failed; activation skipped';
  END IF;
  UPDATE public.campaigns SET is_active = true
    WHERE id = target_id AND slug = 'help-street-vendor';
END;
$setup$;
COMMIT;
SELECT id, slug, is_active, goal_amount_cents, currency
FROM public.campaigns WHERE slug = 'help-street-vendor';
