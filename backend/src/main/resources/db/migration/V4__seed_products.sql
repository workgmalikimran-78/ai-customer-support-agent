-- Seed demo products for the shop catalog.

INSERT INTO product (id, name, description, price_cents, stock_quantity, image_url, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000100', 'Wireless Mouse', 'Ergonomic wireless mouse with USB-C charging.', 2999, 150, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000101', 'Mechanical Keyboard', 'Compact 75% mechanical keyboard with hot-swappable switches.', 8999, 80, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000102', 'USB-C Hub', '7-in-1 USB-C hub with HDMI, SD card, and 100W passthrough.', 4499, 200, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000103', 'Noise-Cancelling Headphones', 'Over-ear headphones with active noise cancellation, 30hr battery.', 14999, 60, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000104', 'Laptop Stand', 'Adjustable aluminum laptop stand, foldable for travel.', 3499, 120, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000105', 'Webcam 1080p', 'Full HD webcam with autofocus and built-in privacy shutter.', 5999, 95, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000106', 'Portable SSD 1TB', 'USB 3.2 portable SSD, up to 1050MB/s read speed.', 9999, 70, NULL, TRUE),
    ('00000000-0000-0000-0000-000000000107', 'Desk Lamp', 'LED desk lamp with adjustable color temperature and brightness.', 2499, 0, NULL, TRUE);
