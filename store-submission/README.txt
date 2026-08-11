================================================================================
MARVIRA — STORE SUBMISSION PACK
================================================================================
Folder này chứa sẵn text + ảnh để điền App Store Connect và Google Play Console.

Cập nhật: 2026-08-11
App: Marvira · Bundle/Package: com.marvira
Production: https://www.marvira.com · API https://api.marvira.com
Slogan: City adventure, on foot. / Khám phá thành phố bằng đôi chân.

--------------------------------------------------------------------------------
CẤU TRÚC THƯ MỤC
--------------------------------------------------------------------------------
store-submission/
├── README.txt                          ← bạn đang đọc file này
├── content/
│   ├── cheat-sheet.txt                 ← field ngắn hay dùng (copy nhanh)
│   ├── app-store-en.txt                ← App Store (English)
│   ├── app-store-vi.txt                ← App Store (Tiếng Việt)
│   ├── play-store-en.txt               ← Google Play (English)
│   ├── play-store-vi.txt               ← Google Play (Tiếng Việt)
│   ├── review-notes.txt                ← ghi chú cho reviewer + demo account
│   └── age-rating-and-categories.txt   ← age rating / category / export
├── images/
│   ├── icon/
│   │   ├── app-icon-1024.png           ← marketing / iOS source
│   │   ├── app-icon-1024-opaque.png    ← khuyến nghị upload App Store
│   │   └── play-icon-512.png           ← Google Play icon
│   ├── feature-graphic/
│   │   └── play-feature-graphic-1024x500.png   ← bắt buộc trên Play
│   └── screenshots/
│       ├── README.txt                  ← hướng dẫn chụp screenshot thật
│       ├── ios/                        ← bỏ screenshot iPhone/iPad vào đây
│       └── android/                    ← bỏ screenshot Android vào đây
└── scripts/
    └── generate-assets.js              ← regenerate ảnh từ app-icon/

Privacy / Data safety (Apple + Google form answers):
  → xem file gốc repo: store_privacy_labels.txt

--------------------------------------------------------------------------------
THỨ TỰ LÀM KHI SUBMIT
--------------------------------------------------------------------------------
1. Website live: https://www.marvira.com/privacy  (+ /terms + /support)
2. Điền listing text từ content/* (EN primary; VI nếu publish locale Việt)
3. Upload icon + feature graphic từ images/
4. Chụp screenshot thật theo images/screenshots/README.txt
5. Điền App Privacy / Data safety theo store_privacy_labels.txt
6. Điền age rating theo content/age-rating-and-categories.txt
7. Điền demo account trong content/review-notes.txt (thay DEMO_*)
8. Submit review

--------------------------------------------------------------------------------
FILE NÀO DÁN VÀO ĐÂU?
--------------------------------------------------------------------------------
App Store Connect
  Name / Subtitle / Description / Keywords / What’s New
      → content/app-store-en.txt  (+ app-store-vi.txt)
  Review notes / demo account
      → content/review-notes.txt
  Icon 1024
      → images/icon/app-icon-1024-opaque.png
  Screenshots
      → images/screenshots/ios/

Google Play Console
  App name / Short / Full description / What’s new
      → content/play-store-en.txt  (+ play-store-vi.txt)
  Icon 512
      → images/icon/play-icon-512.png
  Feature graphic 1024×500
      → images/feature-graphic/play-feature-graphic-1024x500.png
  Screenshots
      → images/screenshots/android/
  App access / demo
      → content/review-notes.txt

--------------------------------------------------------------------------------
REGENERATE ẢNH (sau khi đổi icon / promo layout)
--------------------------------------------------------------------------------
1. Platform icons (scale 2 mark — source of truth):
     cd repo root
     npm install --no-save --prefix app-icon @resvg/resvg-js sharp
     node app-icon/generate.js

2. Store submission pack (icon 1024/512, feature graphic):
     cd store-submission/scripts
     npm install
     node generate-assets.js

   Icon store lấy từ app-icon/marvira-icon-master.png (1024).
   Play 512 copy từ marketing/public/icons/icon-512.png nếu có.

--------------------------------------------------------------------------------
LIÊN HỆ / URL (điền sẵn trong text)
--------------------------------------------------------------------------------
support@marvira.com
https://www.marvira.com
https://www.marvira.com/privacy
https://www.marvira.com/terms
https://www.marvira.com/support
