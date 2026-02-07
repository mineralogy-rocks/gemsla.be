-- Make the reports bucket private (disables /object/public/ endpoint)
UPDATE storage.buckets SET public = FALSE WHERE id = 'reports';

-- Convert existing full URLs to storage paths
UPDATE public.report_images
SET image_url = REGEXP_REPLACE(
    image_url,
    '^.*/storage/v1/object/public/reports/',
    ''
)
WHERE image_url LIKE '%/storage/v1/object/public/reports/%';
