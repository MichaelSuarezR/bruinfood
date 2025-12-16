# BruinCoin Tech Stack

## 📱 Frontend Tech Stack

### **Core Framework**
- **React Native** `0.81.5` - Cross-platform mobile framework
- **React** `19.1.0` - UI library
- **Expo** `54.0.21` - Development platform and toolchain
  - Expo Go for development
  - Expo SDK for native features

### **Navigation**
- **@react-navigation/native** `^7.1.19` - Navigation library
- **@react-navigation/native-stack** `^7.6.2` - Stack navigator
- **@react-navigation/bottom-tabs** `^7.7.2` - Bottom tab navigator
- **@react-navigation/stack** `^7.6.1` - Stack navigator (legacy)

### **Backend Services**
- **@supabase/supabase-js** `^2.78.0` - Supabase client library
  - Authentication (email/password)
  - Database queries
  - Real-time subscriptions (if used)

### **UI Components & Styling**
- **@expo/vector-icons** `^15.0.3` - Icon library (Ionicons)
- **expo-linear-gradient** `^15.0.7` - Gradient backgrounds
- **react-native-safe-area-context** `~5.6.0` - Safe area handling
- **react-native-screens** `~4.16.0` - Native screen components
- **expo-status-bar** `~3.0.8` - Status bar component

### **Media & Files**
- **expo-image-picker** `^17.0.8` - Image selection from camera/gallery
- **expo-file-system** `^19.0.17` - File system operations
  - Read/write files
  - Base64 encoding for image uploads

### **Utilities**
- **react-native-url-polyfill** `^3.0.0` - URL polyfill for React Native
- **@expo/ngrok** `^4.1.3` - Tunneling for development

### **Form Controls**
- **@react-native-community/slider** `^5.1.1` - Slider component

### **Development Tools**
- **TypeScript** `~5.9.2` - Type safety
- **@types/react** `~19.1.10` - React type definitions

### **State Management**
- **React Hooks** (built-in)
  - `useState` - Local component state
  - `useEffect` - Side effects and lifecycle
  - `useCallback` - Memoized callbacks
  - `useMemo` - Memoized values

### **Styling Approach**
- **StyleSheet API** (React Native built-in)
  - No CSS framework
  - Inline styles via StyleSheet.create()
  - Platform-specific styling with Platform.OS

---

## 🔧 Backend Tech Stack

### **Core Framework**
- **Node.js** `>=18.0.0` - JavaScript runtime
- **Express.js** `^4.18.2` - Web application framework
- **TypeScript** `^5.3.3` - Type-safe JavaScript

### **Database & Storage**
- **Supabase** (PostgreSQL)
  - **@supabase/supabase-js** `^2.38.4` - Supabase client
  - PostgreSQL database
  - Supabase Storage (for images)
  - Supabase Auth (JWT-based)

### **Middleware**
- **cors** `^2.8.5` - Cross-Origin Resource Sharing
- **helmet** `^7.1.0` - Security headers
- **express.json** - JSON body parser (50MB limit)
- **express.urlencoded** - URL-encoded body parser (50MB limit)

### **Environment & Configuration**
- **dotenv** `^16.3.1` - Environment variable management

### **Development Tools**
- **nodemon** `^3.0.2` - Auto-restart on file changes
- **ts-node** `^10.9.2` - TypeScript execution
- **jest** `^29.7.0` - Testing framework
- **@types/node** `^20.10.5` - Node.js type definitions
- **@types/express** `^4.17.21` - Express type definitions
- **@types/cors** `^2.8.17` - CORS type definitions
- **@types/jest** `^29.5.8` - Jest type definitions

### **Build & Deployment**
- **TypeScript Compiler** - Compiles TS to JS in `dist/` folder
- **Railway** - Deployment platform (configured in `railway.json`)

---

## 🗄️ Database & Storage

### **Database: Supabase (PostgreSQL)**
- **Tables:**
  - `users` - User profiles
  - `Trades` - Trade listings
  - `messages` - Chat messages
  - `conversations` - Chat conversations
  - `offers` - Trade offers
  - `ratings` - User ratings

### **Storage: Supabase Storage**
- **Bucket:** `trade-images`
- **Purpose:** Store uploaded images (profile pictures, listing images)
- **Access:** Public URLs for images

### **Authentication: Supabase Auth**
- **Method:** Email/password authentication
- **Tokens:** JWT (JSON Web Tokens)
- **Session Management:** Handled by Supabase client

---

## 🔌 API Architecture

### **API Style**
- **RESTful API** - REST principles
- **HTTP Methods:** GET, POST, PATCH, DELETE
- **Response Format:** JSON
- **Base URL:** `/api`

### **API Endpoints**
```
/api/users          - User management
/api/trades         - Trade listings
/api/messages       - Messaging
/api/conversations  - Conversations
/api/offers         - Trade offers
/api/ratings        - User ratings
/api/looking-for    - User preferences
/api/upload         - File uploads
```

---

## 🛠️ Development Tools

### **Frontend**
- **Expo CLI** - Development server and tooling
- **Expo Go** - Mobile app for testing
- **Metro Bundler** - JavaScript bundler
- **TypeScript** - Type checking

### **Backend**
- **nodemon** - Auto-restart on changes
- **ts-node** - Direct TypeScript execution
- **TypeScript Compiler** - Build process

### **Version Control**
- **Git** - Version control
- **GitHub** - Repository hosting

---

## 📦 Package Managers

- **npm** - Node Package Manager
  - Frontend: `frontend/mobile/package.json`
  - Backend: `backend/package.json`

---

## 🚀 Deployment

### **Frontend**
- **Platform:** Expo
- **Options:**
  - Expo Go (development)
  - EAS Build (production builds)
  - App Store / Google Play (native apps)
  - Web (Expo web)

### **Backend**
- **Platform:** Railway
- **Configuration:** `railway.json`
- **Build Process:**
  1. Install dependencies
  2. Run `npm run build` (TypeScript compilation)
  3. Start server from `dist/server.js`

---

## 🔐 Security

### **Authentication**
- **Supabase Auth** - JWT-based authentication
- **Session Management** - Automatic token refresh

### **API Security**
- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Input Validation** - On both frontend and backend
- **File Upload Limits** - 50MB max size

### **Database Security**
- **Row-Level Security (RLS)** - Supabase policies
- **SQL Injection Protection** - Supabase client handles parameterization

---

## 📊 Data Flow

### **Frontend → Backend**
1. React Native app makes HTTP requests to Express API
2. API endpoints process requests
3. Supabase client queries database
4. Results returned as JSON
5. Frontend updates UI

### **Image Upload Flow**
1. `expo-image-picker` → Select image
2. `expo-file-system` → Convert to base64
3. POST to `/api/upload/images` → Backend receives base64
4. Backend uploads to Supabase Storage
5. Returns public URL
6. Frontend saves URL to database

---

## 🔄 Real-time Capabilities

### **Current Implementation**
- **Polling** - Frontend polls for updates
- **No WebSockets** - Not currently implemented

### **Potential Enhancement**
- **Supabase Realtime** - Can be added for:
  - Live messaging
  - Real-time listing updates
  - Live notifications

---

## 📝 Summary

**Frontend:**
- React Native + Expo for mobile development
- Supabase for backend services
- React Navigation for routing
- TypeScript for type safety

**Backend:**
- Express.js REST API
- Supabase (PostgreSQL + Storage + Auth)
- TypeScript for type safety
- Railway for deployment

**Architecture:**
- Client-server architecture
- RESTful API design
- JWT authentication
- File storage via Supabase Storage

