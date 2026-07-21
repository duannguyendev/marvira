# Troubleshooting Metro Connection Issues

## "Could not connect to development server" Error

If you see this error after the app builds successfully, try these solutions:

### Solution 1: Port Forwarding (Already Done)
I've already set up port forwarding. If it doesn't work, run:
```powershell
adb reverse tcp:8081 tcp:8081
```

### Solution 2: Reload the App
1. Shake your device/emulator (or press `Ctrl+M` on emulator)
2. Select **"Reload"** from the developer menu
3. Or press `R` twice in the Metro terminal

### Solution 3: Check Metro is Running
Make sure Metro bundler is running in a separate terminal:
```powershell
npm start
```

You should see:
```
Metro waiting on exp://192.168.x.x:8081
```

### Solution 4: Restart Everything
1. Stop Metro (Ctrl+C)
2. Close the app on emulator
3. Run:
   ```powershell
   npm start -- --reset-cache
   ```
4. In another terminal:
   ```powershell
   npm run android
   ```

### Solution 5: Check Firewall/Antivirus
- Make sure Windows Firewall isn't blocking port 8081
- Temporarily disable antivirus to test

### Solution 6: Use IP Address
If using a physical device, you may need to:
1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for IPv4 address (e.g., 192.168.1.100)

2. Shake device → Dev Settings → Debug server host → Enter: `192.168.1.100:8081`

### Solution 7: Check ADB Connection
```powershell
adb devices
```
Should show your device/emulator listed.

### Solution 8: Clear App Data
```powershell
adb shell pm clear com.marvira
```
Then restart the app.

