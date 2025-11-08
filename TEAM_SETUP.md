\# Team Setup Guide



\## Prerequisites

\- Node.js v18+ installed

\- Git installed



\## Quick Start (5 minutes)



\### 1. Backend Setup

```bash

cd backend

npm install

```



Create `.env` file:

```

PORT=3001

NODE\_ENV=development

MONGODB\_URI=mongodb+srv://stera-technology:p99usxzNqm8mRO7g@cluster0.hz3awrs.mongodb.net/stera-iot?retryWrites=true\&w=majority

JWT\_SECRET=your-secret-key

CORS\_ORIGIN=http://localhost:3000

```



Start backend:

```bash

npm run dev

```



\### 2. Frontend Setup (New terminal)

```bash

cd frontend

npm install

npm start

```



Browser opens automatically to: http://localhost:3000



\### 3. Mobile App (Optional)

```bash

cd mobile

npm install

npx expo start

```



Press 'w' for web or scan QR code with Expo Go app.



\## Features to Demo

\- Real-time dashboard

\- Live forklift tracking

\- Interactive map

\- Mobile app

\- Auto-refresh



\## Architecture

\- Backend: Node.js + Express + MongoDB

\- Frontend: React 18

\- Mobile: React Native + Expo

\- Database: MongoDB Atlas (cloud)

