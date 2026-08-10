================================================================================
MARVIRA — STORE SUBMISSION PACK
================================================================================
Folder này chứa sẵn text + ảnh để điền App Store Connect và Google Play Console.

Cập nhật: 2026-08-07
App: Marvira · Bundle/Package: com.marvira
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
│   ├── promotional/                    ← bộ promo premium (5 slides × sizes)
│   │                                     regenerate: node scripts/generate-promotional.js
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
   (hiện promotional/ chỉ là placeholder — nên thay trước review công khai)
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
      → images/screenshots/ios/  (hoặc promotional/*-ios-6.7.png tạm thời)

Google Play Console
  App name / Short / Full description / What’s new
      → content/play-store-en.txt  (+ play-store-vi.txt)
  Icon 512
      → images/icon/play-icon-512.png
  Feature graphic 1024×500
      → images/feature-graphic/play-feature-graphic-1024x500.png
  Screenshots
      → images/screenshots/android/  (hoặc promotional/*-android-phone.png)
  App access / demo
      → content/review-notes.txt

--------------------------------------------------------------------------------
REGENERATE ẢNH
--------------------------------------------------------------------------------
cd store-submission/scripts
npm install
node generate-assets.js

--------------------------------------------------------------------------------
LIÊN HỆ / URL (điền sẵn trong text)
--------------------------------------------------------------------------------
support@marvira.com
https://www.marvira.com
https://www.marvira.com/privacy
https://www.marvira.com/terms
https://www.marvira.com/support
