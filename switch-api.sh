#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONFIG_FILE="src/config/api.ts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📡 NomiSafe API Environment Switcher${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Select your device/environment:"
echo ""
echo "  1) 📱 Android Emulator (uses 10.0.2.2)"
echo "  2) 📲 Physical Device (uses your Mac IP)"
echo "  3) 🌐 Production Server (EC2)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    DEVICE_TYPE="EMULATOR"
    ;;
  2)
    DEVICE_TYPE="PHYSICAL_DEVICE"
    # Get Mac IP automatically
    MAC_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.102")
    echo ""
    echo -e "${YELLOW}ℹ️  Detected Mac IP: ${MAC_IP}${NC}"
    read -p "Is this correct? [y/n]: " confirm
    if [[ $confirm != "y" ]]; then
      read -p "Enter your Mac IP address: " MAC_IP
    fi
    # Update MAC_IP in the file
    sed -i '' "s/export const MAC_IP = '[^']*'/export const MAC_IP = '${MAC_IP}'/" "$CONFIG_FILE"
    ;;
  3)
    DEVICE_TYPE="PRODUCTION"
    ;;
  *)
    echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

# Update DEVICE_TYPE in the config file
sed -i '' "s/export const DEVICE_TYPE: DeviceType = '[^']*'/export const DEVICE_TYPE: DeviceType = '${DEVICE_TYPE}'/" "$CONFIG_FILE"

echo ""
echo -e "${GREEN}✅ API configuration updated!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Configuration:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "export const DEVICE_TYPE" "$CONFIG_FILE"
if [[ $DEVICE_TYPE == "PHYSICAL_DEVICE" ]]; then
  grep "export const MAC_IP" "$CONFIG_FILE"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  Remember to reload the app:${NC}"
echo "   Press 'r' twice in Metro bundler terminal"
echo ""
