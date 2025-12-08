#!/bin/bash

# Stera Forklift IoT Infrastructure Quick Setup
# Run with: chmod +x setup.sh && sudo ./setup.sh

set -e

echo "=========================================="
echo "Stera Forklift IoT Infrastructure Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root for system packages
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo for system package installation"
    exit 1
fi

ACTUAL_USER=${SUDO_USER:-$USER}
ACTUAL_HOME=$(getent passwd "$ACTUAL_USER" | cut -d: -f6)

echo ""
echo "Step 1: Updating system packages..."
apt update -qq
print_status "System updated"

echo ""
echo "Step 2: Installing Mosquitto MQTT Broker..."
apt install -y mosquitto mosquitto-clients > /dev/null 2>&1
print_status "Mosquitto installed"

# Configure Mosquitto
cat > /etc/mosquitto/conf.d/forklift.conf << EOF
listener 1883
allow_anonymous true
EOF

systemctl restart mosquitto
systemctl enable mosquitto > /dev/null 2>&1
print_status "Mosquitto configured and started"

echo ""
echo "Step 3: Installing InfluxDB..."
if ! command -v influx &> /dev/null; then
    wget -q https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
    dpkg -i influxdb2-2.7.1-amd64.deb > /dev/null 2>&1
    rm influxdb2-2.7.1-amd64.deb
    print_status "InfluxDB installed"
else
    print_status "InfluxDB already installed"
fi

systemctl start influxdb
systemctl enable influxdb > /dev/null 2>&1
print_status "InfluxDB started"

echo ""
echo "Step 4: Setting up Python environment..."
apt install -y python3-venv python3-pip > /dev/null 2>&1

WORK_DIR="$ACTUAL_HOME/stera-forklift"
mkdir -p "$WORK_DIR"

# Create virtual environment as the actual user
sudo -u "$ACTUAL_USER" python3 -m venv "$WORK_DIR/venv"
sudo -u "$ACTUAL_USER" "$WORK_DIR/venv/bin/pip" install -q paho-mqtt influxdb-client
print_status "Python environment created at $WORK_DIR"

echo ""
echo "Step 5: Opening firewall ports..."
if command -v ufw &> /dev/null; then
    ufw allow 1883/tcp > /dev/null 2>&1 || true
    ufw allow 8086/tcp > /dev/null 2>&1 || true
    print_status "Firewall configured (ports 1883, 8086)"
else
    print_status "UFW not installed, skipping firewall config"
fi

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Set up InfluxDB (open http://localhost:8086):"
echo "   - Organization: HAMK"
echo "   - Bucket: forklift_data"
echo "   - Save your API token"
echo ""
echo "2. Copy files to $WORK_DIR:"
echo "   - mqtt_to_influx.py"
echo "   - .env (from .env.template)"
echo ""
echo "3. Update .env with your InfluxDB token"
echo ""
echo "4. Test MQTT broker:"
echo "   Terminal 1: mosquitto_sub -t 'forklift/mpu6050' -v"
echo "   Terminal 2: mosquitto_pub -t 'forklift/mpu6050' -m '{\"test\":1}'"
echo ""
echo "5. Run the Python bridge:"
echo "   cd $WORK_DIR"
echo "   source venv/bin/activate"
echo "   export \$(cat .env | xargs)"
echo "   python mqtt_to_influx.py"
echo ""
echo "=========================================="
