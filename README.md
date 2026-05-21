# IncidentApp: Enterprise Incident Management System

A full-stack, real-time Incident Management platform built for teams. This application allows organizations to report, track, and resolve incidents with real-time WebSocket collaboration, strict Role-Based Access Control (RBAC), and multi-tenant data isolation.

### 🌐 Live Demo
- **Frontend (Vercel):** [https://incident-management-platform-khaki.vercel.app](https://incident-management-platform-khaki.vercel.app)
- **Backend API (Render):** [https://incident-management-platform.onrender.com](https://incident-management-platform.onrender.com)

## 🚀 Tech Stack

### Backend
- **Node.js & Express**: Fast, lightweight API framework.
- **TypeScript**: Strictly typed backend logic.
- **MongoDB & Mongoose**: NoSQL database utilized for scalable document storage and advanced data aggregations.
- **Socket.IO**: Real-time bidirectional event-based communication.
- **JSON Web Tokens (JWT)**: Secure stateless authentication featuring access and refresh token rotation.
- **Bcrypt**: Cryptographic password hashing.

### Frontend
- **React 18 & Vite**: Lightning-fast modern frontend build tool.
- **TypeScript**: End-to-end type safety.
- **Redux Toolkit**: Centralized state management for authentication and session data.
- **Tailwind CSS**: Utility-first styling for a highly responsive, modern UI.
- **Axios**: HTTP client configured with automated silent token-refresh interceptors.

---

## ✨ Core Features

- Multi-tenant organization-based architecture
- JWT Authentication with refresh token flow
- Role-Based Access Control (Admin / Manager / Developer)
- Incident CRUD management
- Real-time updates using Socket.IO
- Activity timeline tracking
- Dashboard analytics using MongoDB aggregation
- Advanced filtering, sorting, and pagination
- Comment system with mention parsing
- Organization switching support
- Secure protected APIs

---

## 🏗 Architecture Decisions

1. **Multi-Tenant Isolation**: The platform is built around `Organizations`. Every critical MongoDB collection utilizes an `organizationId` reference. Backend APIs enforce strict context checks to ensure users can never query incidents or comments outside of their currently active workspace.
2. **JWT Refresh Rotation**: To balance UX and security, the app issues a short-lived `AccessToken` (15m) and a long-lived RefreshToken stored client-side for session continuity (7d). The Axios interceptor silently catches 401s, spins up the refresh flow, and replays failed requests without kicking the user to the login screen.
3. **Module-Based Structure**: The backend is architected into specific domains (e.g., `auth`, `incident`, `organization`). Each module encapsulates its own Routes, Controllers, Services, and Validation logic. This ensures highly scalable and maintainable code.
4. **Optimistic UI Updates**: Real-time WebSockets don't just trigger blunt reloading. When a socket event fires (like a severity change), the React frontend "optimistically" patches the DOM instantly to prevent screen flickering, ensuring a seamless experience even if the user is typing a comment.

---

## 📡 Main API Modules

- `/api/v1/auth`
- `/api/v1/organizations`
- `/api/v1/incidents`
- `/api/v1/comments`
- `/api/v1/dashboard`

---

## 🔐 Security Features

- Password hashing with bcrypt
- JWT authentication
- Refresh token flow
- Protected API routes
- RBAC middleware authorization
- Helmet middleware
- Express rate limiting
- Joi request validation
- MongoDB query sanitization
- Environment-based configuration

---

## ⚖️ Tradeoffs & Assignment Constraints

Due to the time constraints of this assignment, the following pragmatic tradeoffs were made:

- **Lightweight Real-Time Architecture**: We utilized standard in-memory Socket.IO rooms rather than integrating a heavy Pub/Sub message broker like Redis or Kafka. This is highly performant for this scale but would need a Redis Adapter if scaled across multiple load-balanced server nodes.
- **Postman vs. Swagger**: We provided an export-ready Postman Collection (`IncidentApp_Postman_Collection.json`) rather than writing heavy Swagger/OpenAPI annotations across every backend controller. This delivered a highly functional, instantly-testable API spec much faster.
- **Implicit Admin UI**: Strict RBAC is heavily enforced at the API layer (e.g., Developers cannot invite users), but we opted not to build a massive standalone "Admin Control Panel" on the frontend to keep the scope tight and focused on Incident Management.
- **Mentions System**: The backend successfully extracts `@email` tags from comments via Regex and saves them to the DB, but we omitted a visual "Notification Bell" dropdown from the frontend to prioritize the core Activity Timeline requirements.
- **Local State over Caching Engines**: We utilized React `useState` and `useEffect` alongside Redux for auth, rather than installing a heavy caching engine like React Query.

---

## 📂 Folder Structure

```text
/
├── frontend/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI elements (Navbar, Modals)
│   │   ├── hooks/             # Custom React hooks (useSocket, useDebounce)
│   │   ├── pages/             # Core views (Dashboard, IncidentDetail)
│   │   ├── services/          # API communication (Axios with interceptors)
│   │   ├── store/             # Redux slices (Auth state)
│   │   └── App.tsx            # React Router configuration
│
├── backend/                   # Express + Node Backend
│   ├── src/
│   │   ├── middleware/        # Auth, RBAC, Validation, Rate Limiting
│   │   ├── modules/           # Domain-driven backend modules
│   │   │   ├── auth/          # JWT, Login, Signup
│   │   │   ├── comment/       # Comment models, Mentions parsing
│   │   │   ├── dashboard/     # MongoDB Aggregation pipelines
│   │   │   ├── incident/      # CRUD, Activity Timeline logging
│   │   │   └── organization/  # Multi-tenancy, Invites
│   │   ├── utils/             # Socket instance, Error classes
│   │   ├── app.ts             # Express config & middleware setup
│   │   └── server.ts          # DB connection & Server boot
│
├── .env.example               # Template for environment variables
└── IncidentApp_Postman_Collection.json # API Documentation
```

---

## ⚙️ Environment Variables

To run the application, you need to create two `.env` files.

### Backend (`/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/incident_app
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`/frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 💻 How to Run the Project Locally

### 1. Start the MongoDB Database
Ensure you have MongoDB running locally on `mongodb://localhost:27017`.

### 2. Boot the Backend
Open a terminal in the root folder:
```bash
cd backend
npm install
npm run dev
```
*The backend will start on `http://localhost:5000`.*

### 3. Boot the Frontend
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

### 4. API Testing
An `IncidentApp_Postman_Collection.json` file is located in the root directory. Simply drag and drop this file into Postman to instantly test all backend routes. Ensure you set the `ACCESS_TOKEN` variable in Postman after logging in!

---

## ✅ Build Verification

Frontend:
```bash
cd frontend
npm run build
```

Backend:
```bash
npm run build
```

Both frontend and backend successfully compile in production mode without TypeScript errors.
