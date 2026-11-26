-- Business decision (docs/ROADMAP-BISNIS.md): the template marketplace is postponed and shown as
-- "Segera hadir" with an interest survey. Saved feature maps override the code default, so set it here.
-- Admins can switch it back to Aktif from /admin/pengaturan-admin.
UPDATE "SystemSetting"
SET "value" = jsonb_set("value"::jsonb, '{MARKETPLACE}', '"COMING_SOON"')::text,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'feature_flags';
