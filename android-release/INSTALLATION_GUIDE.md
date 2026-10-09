# OB Hotspot — Samsung Galaxy Tab A6 Installation & Sideload Guide

This guide provides step-by-step instructions for transferring, installing, and configuring `OB-Hotspot.apk` on your **Samsung Galaxy Tab A6** tablet.

---

## 1. Prerequisites on Samsung Galaxy Tab A6

Before installing, configure your Samsung tablet to allow manual application installation (sideloading):

### Enable "Unknown Sources"
1. Open the **Settings** app on your Galaxy Tab A6.
2. Scroll down and tap **Lock screen and security** (or **Security** on Android 5.1).
3. Locate the setting labeled **Unknown sources** (*Allow installation of apps from sources other than the Play Store*).
4. Tap the switch to turn it **ON**.
5. When the security prompt appears, check **Allow this installation only** (or tap **OK**).

> **Note for Android 8.0/8.1 users**: If your Tab A6 has been updated to Android 8+, the setting is per-app. When you open the APK from **My Files** or **Chrome**, a prompt will ask *"For your security, your phone is not allowed to install unknown apps from this source"*. Tap **Settings** in that dialog and toggle **Allow from this source** to **ON**, then tap the Back button.

---

## 2. Transfer & Installation Methods

Choose any of the four convenient methods below to transfer and install `OB-Hotspot.apk`:

---

### Method A: USB Cable Transfer (Recommended for Windows / Mac / Linux)

1. Connect your Samsung Galaxy Tab A6 to your computer using a standard Micro-USB cable.
2. On the tablet, unlock the screen. If prompted with *"Allow access to tablet data?"*, tap **ALLOW**.
3. On your computer:
   - **Windows**: Open File Explorer and navigate to **Galaxy Tab A6 > Internal storage > Download**.
   - **macOS**: Open *Android File Transfer* or *OpenMTP* and open the **Download** folder.
   - **Linux**: Open your file manager and browse the mounted MTP device to `/Download/`.
4. Copy `OB-Hotspot.apk` from the `android-release/` directory into the tablet's **Download** folder.
5. On the Galaxy Tab A6:
   - Open the **Samsung** folder on your Home screen / App Drawer.
   - Tap **My Files** > **Installation files** (or **Internal storage** > **Download**).
   - Tap `OB-Hotspot.apk`.
   - Tap **INSTALL** at the bottom right.
   - Tap **OPEN** once installation finishes.

---

### Method B: ADB Command Line Sideload (Fastest for Developers)

If you have Android Platform Tools installed on your computer:

1. Enable USB Debugging on the tablet:
   - Go to **Settings** > **About tablet** > **Software info**.
   - Tap **Build number** 7 times until you see the toast message *"Developer mode has been enabled"*.
   - Press Back twice to return to **Settings** > **Developer options**.
   - Turn on **USB debugging**.
2. Connect the tablet to your computer via USB.
3. Open a terminal and run:
   ```bash
   adb devices
   ```
   *(Accept the "Allow USB debugging?" prompt on the tablet screen by checking "Always allow" and tapping OK).*
4. Install the application directly:
   ```bash
   adb install -r android-release/OB-Hotspot.apk
   ```
5. ADB will return `Success`. Launch the app from the tablet's app drawer or run:
   ```bash
   adb shell am start -n com.hotspot.internetcoupon/.MainActivity
   ```

---

### Method C: MicroSD Card Transfer (No Computer Drivers Needed)

1. Insert a standard MicroSD card into your computer's card reader.
2. Copy `OB-Hotspot.apk` onto the MicroSD card.
3. Safely eject the card and insert it into the MicroSD slot on the side of your Galaxy Tab A6.
4. On the tablet, open **My Files** > **SD card**.
5. Tap `OB-Hotspot.apk`, review permissions, and tap **INSTALL**.

---

### Method D: Local Wi-Fi / Browser Download

1. If you run the project locally on your PC (`npm run dev`), both your PC and tablet are connected to the same local Wi-Fi router.
2. Note your PC's local IP address (e.g. `http://192.168.1.50:3000`).
3. Open **Chrome** or **Samsung Internet** on your tablet and download the APK directly, or serve it via a local Python/Node HTTP server:
   ```bash
   # In android-release/ directory on your PC:
   npx serve . -p 8080
   ```
4. On the tablet browser, navigate to `http://<PC-IP>:8080/OB-Hotspot.apk` to download and tap the downloaded file to install.

---

## 3. Initial Configuration & Verification on First Launch

1. **Permissions Review**:
   - On first launch, the app may request permissions for **Network State** and **Notifications** (Android 13+). Tap **Allow**.
2. **Network Connection**:
   - Ensure the tablet is connected to your hotspot Wi-Fi network (or router LAN).
   - The app's built-in offline banner will indicate green/active once connected to the local gateway or backend server.
3. **Kiosk / Counter POS Placement**:
   - For dedicated hotspot cashier use, place the tablet horizontally (landscape).
   - In **Settings** > **Display**, you may increase **Screen timeout** to 10 or 30 minutes, or enable **Stay awake while charging** in **Developer options**.

---

## 4. Troubleshooting Common Samsung Tablet Issues

### Issue 1: "There was a problem parsing the package" (Parse Error)
- **Cause**: Corrupted file transfer or Android OS version lower than `minSdkVersion`.
- **Solution**:
  - The OB Hotspot APK is built with `minSdkVersion: 22` (Android 5.1 Lollipop). Verify your Tab A6 is running Android 5.1.1 or newer in **Settings > About tablet > Android version**.
  - Re-copy the APK to ensure the transfer was not interrupted.

### Issue 2: "Blocked by Play Protect"
- **Cause**: Google Play Protect automatically flags APKs that are self-signed and installed outside the Google Play Store.
- **Solution**:
  - In the Play Protect warning dialog, tap **More details** (small text below the warning).
  - Tap **Install anyway (unsafe)**.
  - The app will install cleanly without any risk.

### Issue 3: "Screen Overlay Detected" (Android 6.0 TouchWiz bug)
- **Cause**: An active overlay application (such as blue light filter apps like Twilight, Clean Master, or Facebook Messenger chat heads) prevents pressing the "Install" button.
- **Solution**:
  - Temporarily turn off any screen dimmer or blue light filter app, or disable them in **Settings > Applications > Application Manager > More > Apps that can appear on top**.

### Issue 4: "App not installed"
- **Cause**: Insufficient internal storage or conflicting package signature from a previous installation.
- **Solution**:
  - Check internal storage in **Settings > Storage**. Ensure at least 150MB of free space is available.
  - If a previous test version was installed, uninstall it first: long-press the OB Hotspot icon > **Uninstall**, then install the new APK.
