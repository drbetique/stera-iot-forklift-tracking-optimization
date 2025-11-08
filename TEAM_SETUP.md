\# 🚀 Team Setup Guide - Stera IoT Forklift Tracking



\## Prerequisites

\- Node.js v18+ (\[Download](https://nodejs.org/))

\- Git (\[Download](https://git-scm.com/))

\- MongoDB Atlas account (or use provided credentials)



---



\## 📥 Quick Start (10 minutes)



\### 1️⃣ Clone Repository

```bash

git clone https://github.com/YOUR\_USERNAME/stera-iot-forklift-tracking.git

cd stera-iot-forklift-tracking

```



\### 2️⃣ Backend Setup

```bash

cd backend

npm install

```



\*\*Create `.env` file\*\* (copy from `.env.example`):

```bash

cp .env.example .env

```



\*\*Edit `.env` and add the MongoDB connection string:\*\*

```

MONGODB\_URI=mongodb+srv://stera-technology:p99usxzNqm8mRO7g@cluster0.hz3awrs.mongodb.net/stera-iot?retryWrites=true\&w=majority

```



\*\*Start backend:\*\*

```bash

npm run dev

```



✅ You should see: `✅ MongoDB Connected`



---



\### 3️⃣ Frontend Setup (New Terminal)

```bash

cd frontend

npm install

npm start

```



✅ Browser opens automatically to: http://localhost:3000



---



\### 4️⃣ Mobile App Setup (Optional)

```bash

cd mobile

npm install

```



\*\*For web preview:\*\*

```bash

npx expo start

```

Press `w` to open in browser



\*\*For phone:\*\*

1\. Install \*\*Expo Go\*\* app on your phone

2\. Scan QR code from terminal

3\. App loads on your phone!



---



\## 🎯 Testing the System



\### Seed Sample Data (if database is empty):

```bash

cd backend

npm run seed

```



This creates:

\- 3 sample forklifts (FL-001, FL-002, FL-003)

\- 5 stations (Loading docks, storage, charging)

\- 30 telemetry records



\### Access Points:

\- \*\*Web Dashboard:\*\* http://localhost:3000

\- \*\*Backend API:\*\* http://localhost:3001

\- \*\*API Health:\*\* http://localhost:3001/health

\- \*\*Mobile:\*\* Via Expo Go app



---



\## 📱 Running Mobile App on Your Phone



\### Requirements:

\- Phone and computer on \*\*same WiFi\*\*

\- \*\*Expo Go\*\* app installed



\### Steps:

1\. Find your computer's IP address:

```bash

&nbsp;  ipconfig

```

&nbsp;  Look for `IPv4 Address` under WiFi adapter



2\. Update `mobile/services/api.js`:

```javascript

&nbsp;  const API\_BASE\_URL = 'http://YOUR\_IP:3001';

```



3\. Allow firewall (Windows):

```bash

&nbsp;  netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3001

```



4\. Start Expo and scan QR code!



---



\## 🏗️ Project Structure

```

stera-iot-project/

├── backend/           # Node.js + Express API

│   ├── server.js

│   ├── src/

│   │   ├── models/    # MongoDB schemas

│   │   ├── routes/    # API endpoints

│   │   ├── config/    # Database config

│   │   └── seeds/     # Sample data

│   └── package.json

│

├── frontend/          # React web dashboard

│   ├── src/

│   │   ├── components/

│   │   └── services/

│   └── package.json

│

└── mobile/            # React Native app

&nbsp;   ├── screens/

&nbsp;   ├── services/

&nbsp;   └── package.json

```



---



\## ✨ Key Features



\### Web Dashboard:

\- ✅ Real-time forklift monitoring

\- ✅ Live statistics (Total, Working, Idle)

\- ✅ Interactive map with GPS tracking

\- ✅ Auto-refresh every 10 seconds

\- ✅ Beautiful gradient UI



\### Mobile App:

\- ✅ Cross-platform (iOS + Android)

\- ✅ Real-time data sync

\- ✅ Detailed telemetry screens

\- ✅ Pull-to-refresh

\- ✅ Native navigation



\### Backend API:

\- ✅ RESTful architecture

\- ✅ 8+ endpoints

\- ✅ MongoDB integration

\- ✅ Real-time telemetry handling

\- ✅ Activity classification



---



\## 🔧 Tech Stack



\*\*Backend:\*\*

\- Node.js + Express.js

\- MongoDB Atlas (cloud database)

\- Mongoose ODM

\- CORS, Helmet (security)



\*\*Frontend:\*\*

\- React 18

\- Leaflet.js (maps)

\- Chart.js (analytics ready)

\- Axios (HTTP client)



\*\*Mobile:\*\*

\- React Native

\- Expo

\- React Navigation



\*\*Hardware Ready:\*\*

\- ESP32 / Arduino / Raspberry Pi compatible

\- GPS, Accelerometer, RFID, Ultrasonic sensors

\- Qorvo DWM1001-DEV UWB positioning



---



\## 🐛 Troubleshooting



\### Backend won't start:

\- Check MongoDB connection string in `.env`

\- Ensure port 3001 is not in use



\### Frontend shows "Disconnected":

\- Make sure backend is running on port 3001

\- Check CORS settings



\### Mobile app network error:

\- Update API\_BASE\_URL with your computer's IP

\- Ensure phone and computer on same WiFi

\- Check firewall allows port 3001



---



\## 👥 Team



\- \*\*Scrum Master \& Lead Developer:\*\* Victor Betiku



---



\## 📞 Need Help?



Contact victor Betiku or create an issue in the repository.



---



\## 🎉 Next Steps



1\. ✅ Run the system locally

2\. ✅ Explore the dashboard

3\. ✅ Test the mobile app

4\. ✅ Review the code

5\. ✅ Start hardware integration!



\*\*Happy coding!\*\* 🚀

