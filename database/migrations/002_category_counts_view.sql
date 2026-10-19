-- Migration: 002_category_counts_view.sql
-- Description: Create a view for efficient category counting

CREATE OR REPLACE VIEW category_counts AS
SELECT category_detail, COUNT(*) as count
FROM spare_parts
WHERE status = 'ACTIVE' AND category_detail IS NOT NULL
GROUP BY category_detail;

-- Grant permissions to read the view
GRANT SELECT ON category_counts TO anon, authenticated;
