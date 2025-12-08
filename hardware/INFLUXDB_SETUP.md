# InfluxDB v3 Setup for Windows

## Option 1: Use InfluxDB Cloud (Recommended - Easiest)

1. Go to: https://cloud2.influxdata.com/signup
2. Create free account
3. Create a database called `forklift_data`
4. Generate an API token with write access
5. Get your connection details:
   - **Host URL**: (e.g., `https://us-east-1-1.aws.cloud2.influxdata.com`)
   - **Organization**: Your org name
   - **Token**: Your API token

6. Update `hardware/.env`:
   ```env
   INFLUX_HOST=https://your-cloud-url.influxdata.com
   INFLUX_TOKEN=your_api_token_here
   INFLUX_ORG=your_organization
   INFLUX_DATABASE=forklift_data
   ```

## Option 2: Install InfluxDB Locally

### Download InfluxDB 2.x (Compatible with v3 API)

1. **Download**:
   - Go to: https://portal.influxdata.com/downloads/
   - Select: **InfluxDB v2.7** (latest v2)
   - Windows: Download ZIP file

2. **Install**:
   ```cmd
   # Extract to C:\influxdb2
   # Open Command Prompt as Administrator
   cd C:\influxdb2
   ```

3. **Start InfluxDB**:
   ```cmd
   influxd
   ```
   (Keep this terminal open)

4. **Initial Setup** (in a new terminal):

   **Option A: Web UI** (Easier)
   - Open browser: http://localhost:8086
   - Click "Get Started"
   - Fill in:
     - Username: `admin`
     - Password: `admin123456` (or your choice)
     - Organization: `HAMK`
     - Bucket: `forklift_data`
   - Click "Continue"
   - **COPY THE API TOKEN** - save it somewhere safe!

   **Option B: CLI**
   ```cmd
   cd C:\influxdb2
   influx setup ^
     --org HAMK ^
     --bucket forklift_data ^
     --username admin ^
     --password admin123456 ^
     --force
   ```
   Save the token from the output!

5. **Update hardware/.env**:
   ```env
   INFLUX_HOST=http://127.0.0.1:8086
   INFLUX_TOKEN=your_token_from_setup
   INFLUX_ORG=HAMK
   INFLUX_DATABASE=forklift_data
   ```

## Verify Installation

```cmd
# Check if InfluxDB is running
netstat -ano | findstr :8086

# Test connection (if local)
curl http://localhost:8086/health
```

Should return: `{"name":"influxdb","message":"ready for queries and writes","status":"pass"}`

## Create Database (InfluxDB v3 Cloud)

If using InfluxDB Cloud, create database via UI:
1. Go to Data > Buckets
2. Click "Create Bucket"
3. Name: `forklift_data`
4. Retention: 30 days (or as needed)

## Next Steps

Once InfluxDB is running and configured:
1. Update `.env` file with your credentials
2. Run the InfluxDB-only bridge:
   ```cmd
   cd hardware
   venv\Scripts\activate
   python mqtt_influx_bridge.py
   ```

3. Test with MQTT message:
   ```cmd
   venv\Scripts\python test_mqtt.py
   ```

4. Query data in InfluxDB UI (http://localhost:8086 or Cloud UI)
