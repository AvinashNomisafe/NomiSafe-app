# 📡 API Configuration Guide

## Quick Switch

Run this command to easily switch between environments:

```bash
./switch-api.sh
```

## Manual Configuration

Edit `src/config/api.ts` and change the `DEVICE_TYPE`:

```typescript
export const DEVICE_TYPE: DeviceType = 'EMULATOR'; // Change this line
```

### Options:

1. **`'EMULATOR'`** - For Android Emulator / iOS Simulator

   - Android: Uses `http://10.0.2.2:8000/api`
   - iOS: Uses `http://localhost:8000/api`

2. **`'PHYSICAL_DEVICE'`** - For testing on real phone

   - Uses `http://<MAC_IP>:8000/api`
   - Update `MAC_IP` constant with your Mac's local IP
   - Find your IP: `ipconfig getifaddr en0`

3. **`'PRODUCTION'`** - For production server
   - Uses `http://51.20.84.242/api`

## After Changing

1. Save the file
2. Reload the app: Press `r` twice in Metro terminal
3. Check the console for confirmation message

## Troubleshooting

### "Network Error" in Emulator

- ✅ Make sure Django is running: `python manage.py runserver 0.0.0.0:8000`
- ✅ Use `DEVICE_TYPE = 'EMULATOR'`
- ✅ Test connection: `adb shell` then `curl http://10.0.2.2:8000/api/`

### "Network Error" on Physical Device

- ✅ Make sure phone and Mac are on same WiFi
- ✅ Update `MAC_IP` with your current IP: `ipconfig getifaddr en0`
- ✅ Use `DEVICE_TYPE = 'PHYSICAL_DEVICE'`
- ✅ Test connection: Open `http://<MAC_IP>:8000/api/` in phone browser

### Connection Timeout

- ✅ Check firewall settings on Mac
- ✅ Ensure Django is bound to 0.0.0.0, not 127.0.0.1
- ✅ For file uploads, timeout is 60s (should be enough)
