================================================================================
SCREENSHOTS — HOW TO CAPTURE (replace promotional placeholders)
================================================================================
Promotional frames in ../promotional/ are TEMPORARY. Apple and Google prefer
real in-app UI. Capture from a release/staging build with polished sample data.

--------------------------------------------------------------------------------
Recommended shot list (5–8 frames, same story on iOS + Android)
--------------------------------------------------------------------------------
1. Home / Events list — nearby hunts with map or cards
2. Event details — title, map preview, Start CTA
3. Place game — map + unlock / distance to place
4. Question / challenge UI — answering a stop
5. Leaderboard — event or global ranking
6. Create hunt wizard — one clear creator screen
7. (Optional) Completion / share success screen
8. (Optional) Practice tab

--------------------------------------------------------------------------------
Device sizes
--------------------------------------------------------------------------------
iOS (App Store Connect)
  Required for modern phones: iPhone 6.7" — 1290 × 2796 px (portrait)
  Optional: iPhone 6.5" — 1284 × 2778
  If iPad listed: 12.9" — 2048 × 2732
  Save into: ios/

Android (Play Console)
  Phone: at least 2 screenshots
  Recommended: 1080 × 1920 or 1080 × 2340 (portrait)
  Save into: android/
  Feature graphic is separate: ../feature-graphic/

--------------------------------------------------------------------------------
Capture tips
--------------------------------------------------------------------------------
• Use English UI for primary locale; add VI screenshots if you localize listing.
• Hide debug banners, __DEV__ ribbons, localhost errors.
• Prefer outdoor daylight content / real hunt titles (no “test123”).
• Do not show real personal emails of private users.
• Status bar: clean time (9:41), full battery, good signal — optional polish.
• Keep safe margins; important text not under notch / home indicator.
• File format: PNG or JPEG; no transparency for store screenshots.

--------------------------------------------------------------------------------
Tools
--------------------------------------------------------------------------------
• iOS Simulator → Cmd+S / File → Save Screen
• Android Emulator → camera toolbar / adb exec-out screencap
• Physical device + Android Studio Device Manager / Xcode Devices
• Optional: frame with AppMockUp / Rotato — keep frames subtle

--------------------------------------------------------------------------------
Until real shots exist
--------------------------------------------------------------------------------
Upload images/promotional/*-ios-6.7.png and *-android-phone.png only for
internal draft listings. Replace before public review submission.
