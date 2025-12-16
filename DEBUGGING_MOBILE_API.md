# Debugging Mobile App API Connection

## Current Setup
- **Backend IP**: `172.26.97.229:3001`
- **Backend Status**: ✅ Running
- **Expo API URL env**: `EXPO_PUBLIC_API_URL=http://172.26.97.229:3001`

## Step-by-Step Debugging Guide

### 1. Verify Backend is Running
```bash
cd backend
npm run dev
```
You should see: `🚀 BruinCoin API running on port 3001`

### 2. Test Backend from Your Mac
```bash
curl http://172.26.97.229:3001/api/health
```
Should return: `{"status":"OK","message":"BruinCoin API is running!"}`

### 3. Test Backend from Your iPhone's Safari
1. Open Safari on your iPhone
2. Go to: `http://172.26.97.229:3001/api/health`
3. You should see the JSON response

**If this fails**: Network/firewall issue - see steps below

### 4. Check Network Connection
- ✅ iPhone and Mac must be on the **SAME WiFi network**
- ✅ Check your Mac's IP address hasn't changed:
  ```bash
  ifconfig | grep "inet " | grep -v 127.0.0.1
  ```
- ✅ If IP changed, update `EXPO_PUBLIC_API_URL` in `frontend/mobile/.env`

### 5. Check Firewall Settings
**On Mac:**
1. System Settings → Network → Firewall
2. Temporarily disable firewall to test
3. Or add Node.js to allowed apps

**On iPhone:**
- Make sure you're not using a VPN
- Check if corporate/school WiFi has restrictions

### 6. Restart Expo with Clear Cache
```bash
cd frontend/mobile
npm start --clear
```
This ensures `app.config.ts` / `.env` changes are loaded

### 7. Check Console Logs
In Expo console, you should see:
```
=== FETCH TRADES DEBUG ===
API URL: http://172.26.97.229:3001
Full URL: http://172.26.97.229:3001/api/trades?limit=4&offset=0&accepted=false
```

### 8. Common Issues & Solutions

#### Issue: "Network request failed"
**Causes:**
- iPhone and Mac on different WiFi networks
- Firewall blocking connection
- IP address changed

**Solutions:**
1. Verify same WiFi network
2. Disable Mac firewall temporarily
3. Check current IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
4. Update `frontend/mobile/.env` if IP changed

#### Issue: "Request timed out"
**Causes:**
- Backend not running
- Wrong IP address
- Network connectivity issue

**Solutions:**
1. Check backend is running: `lsof -i :3001`
2. Test from Safari on iPhone
3. Verify IP address is correct

#### Issue: "Cannot connect to server"
**Causes:**
- Backend not listening on 0.0.0.0
- Port 3001 blocked

**Solutions:**
1. Verify backend listens on all interfaces (already configured)
2. Check port is open: `netstat -an | grep 3001`

### 9. Alternative: Use Expo Tunnel
If local network doesn't work, use Expo's tunnel mode:
```bash
cd frontend/mobile
npm start --tunnel
```
Then update backend CORS to allow tunnel URL

### 10. Quick Test Commands

**Check if backend is accessible:**
```bash
curl http://172.26.97.229:3001/api/trades?limit=4
```

**Check current IP:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
```

**Check if port is listening:**
```bash
lsof -i :3001 | grep LISTEN
```

## Next Steps
1. Run the app and check Expo console logs
2. Look for the detailed error messages
3. Follow the troubleshooting steps above based on the error
