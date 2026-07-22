-- ============================================================
-- CLB Charity — seed data (safe to skip in production)
-- ============================================================

-- Admin account: email admin@clb.vn / password Admin@123 (bcrypt, cost 12)
INSERT INTO members (full_name, email, password_hash, role)
VALUES ('Admin CLB', 'admin@clb.vn',
        '$2b$12$jGMrbf0fXyY2c/g/FakiCe14izQ4X/ZHZ1i646/LYDnlqaxZrGWoq', 'ADMIN');

-- 2 sample campaigns
INSERT INTO campaigns (title, slug, summary, description, target_amount,
                       bank_account_no, bank_account_name, qr_description,
                       status, category, start_date, created_by)
VALUES
  ('Mua áo ấm cho trẻ em vùng cao', 'mua-ao-am-cho-tre-em-vung-cao',
   'Chiến dịch quyên góp áo ấm cho các em nhỏ vùng cao mùa đông.',
   '<p>Mùa đông đang đến, hàng nghìn em nhỏ vùng cao vẫn thiếu áo ấm. Hãy cùng CLB chung tay.</p>',
   50000000, '1234567890', 'CLB Thiện Nguyện', 'Ung ho ao am',
   'ACTIVE', 'CHILDREN', CURRENT_DATE, 1),
  ('Học bổng sinh viên nghèo 2024', 'hoc-bong-sinh-vien-ngheo-2024',
   'Hỗ trợ học bổng cho sinh viên có hoàn cảnh khó khăn.',
   '<p>Chương trình học bổng dành cho sinh viên vượt khó học giỏi.</p>',
   30000000, '1234567890', 'CLB Thiện Nguyện', 'Hoc bong SV',
   'COMPLETED', 'EDUCATION', CURRENT_DATE - INTERVAL '60 days', 1);

-- 3 sample posts
INSERT INTO posts (title, slug, summary, content, is_published, published_at, created_by)
VALUES
  ('CLB ra mắt website mới', 'clb-ra-mat-website-moi',
   'Website chính thức của CLB đã chính thức ra mắt.',
   '<p>Chúng tôi vui mừng thông báo website mới đã đi vào hoạt động.</p>',
   TRUE, NOW(), 1),
  ('Tổng kết chiến dịch áo ấm 2023', 'tong-ket-chien-dich-ao-am-2023',
   'Nhìn lại những gì đã làm được.',
   '<p>Năm 2023 chúng ta đã trao hơn 2000 chiếc áo ấm.</p>',
   TRUE, NOW() - INTERVAL '7 days', 1),
  ('Kế hoạch hoạt động quý 2', 'ke-hoach-hoat-dong-quy-2',
   'Draft bài viết về kế hoạch sắp tới.',
   '<p>Dự kiến trong quý 2 chúng ta sẽ triển khai 3 chiến dịch mới.</p>',
   FALSE, NULL, 1);
