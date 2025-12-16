# BruinCoin App Architecture Breakdown

## 📱 Frontend (React Native / Expo)

### **Main Entry Point**
- `App.tsx` - Root component managing authentication state, navigation, and screen routing

### **Directory Structure**

```
frontend/mobile/
├── App.tsx                    # Main app entry point
├── index.ts                    # Expo entry point
├── app.config.ts               # Expo configuration (loads .env values)
│
├── screens/                    # All screen components
│   ├── Authentication Flow
│   │   ├── WelcomeScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── WelcomeBackScreen.tsx
│   │   └── CreateAccountFlow.tsx (orchestrator)
│   │       ├── CreateAccountScreen.tsx
│   │       ├── PickProfilePictureScreen.tsx
│   │       ├── EnterUsernameScreen.tsx
│   │       ├── AddBioScreen.tsx
│   │       ├── AccountCreatedScreen.tsx
│   │       ├── PersonalizingScreen.tsx
│   │       ├── InterestsStep1Screen.tsx
│   │       └── InterestsStep2Screen.tsx
│   │
│   ├── Main App Screens
│   │   ├── HomeScreen.tsx              # Browse listings (new & recommended)
│   │   ├── SearchScreen.tsx            # Search and filter listings
│   │   ├── ProfileScreen.tsx           # User profile (own or view others)
│   │   ├── MessagesLandingScreen.tsx   # List of conversations
│   │   └── ChatScreen.tsx               # Individual chat conversation
│   │
│   ├── Listing Management
│   │   ├── CreateListingScreen.tsx     # Create new trade listing
│   │   ├── PreviewListingScreen.tsx     # Preview before publishing
│   │   ├── ListingDetailScreen.tsx      # View listing details
│   │   └── SeeAllScreen.tsx             # See all listings (new/recommended/all)
│   │
│   └── Legacy/Unused
│       ├── RegisterScreen.tsx           # Old registration (replaced by CreateAccountFlow)
│       └── OnboardingFlow.tsx            # Old onboarding (replaced by CreateAccountFlow)
│
├── components/                 # Reusable UI components
│   ├── BottomNavigation.tsx    # Bottom tab navigation
│   ├── TradeCard.tsx           # Listing card component
│   ├── FilterChip.tsx          # Filter tag component
│   ├── ScreenHeader.tsx        # Screen header component
│   └── SlideModal.tsx          # Modal component
│
├── lib/                        # Utilities and configurations
│   ├── supabaseClient.ts       # Supabase client initialization
│   └── api/
│       └── messages.ts         # Message API helpers
│
├── constants/                  # Constants and data
│   └── data.ts                 # Static data (categories, etc.)
│
└── assets/                     # Images and static assets
    ├── logo.png
    └── ...
```

### **Key Technologies**
- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **State Management**: React Hooks (useState, useEffect)
- **Authentication**: Supabase Auth
- **Database**: Supabase (via API)
- **Image Handling**: expo-image-picker, expo-file-system
- **UI Libraries**: @expo/vector-icons, expo-linear-gradient

### **Screen Flow**

#### **Authentication Flow**
1. `WelcomeScreen` → User chooses "Sign in" or "Join Now"
2. **Login Path**: `LoginScreen` → `WelcomeBackScreen` (1s) → Main App
3. **Register Path**: `CreateAccountFlow`:
   - `CreateAccountScreen` (email/password)
   - `PickProfilePictureScreen` (optional)
   - `EnterUsernameScreen` (@username)
   - `AddBioScreen` (bio/interests, optional)
   - `AccountCreatedScreen` (confirmation)
   - `PersonalizingScreen` (1s loading)
   - `InterestsStep1Screen` (buying/selling/trading)
   - `InterestsStep2Screen` (categories)
   - → Main App

#### **Main App Flow**
- **Bottom Navigation**: Home | Search | Profile | Messages
- **Home**: Browse new/recommended listings → Tap → `ListingDetailScreen`
- **Search**: Filter and search listings
- **Profile**: View/edit own profile or view other users' profiles
- **Messages**: List conversations → Tap → `ChatScreen`
- **Create Listing**: `CreateListingScreen` → `PreviewListingScreen` → Publish

---

## 🔧 Backend (Express.js / TypeScript)

### **Main Entry Point**
- `server.ts` - Express server setup, middleware, and route mounting

### **Directory Structure**

```
backend/
├── express/
│   ├── src/
│   │   ├── server.ts            # Express server setup
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.ts      # Supabase client initialization
│   │   │
│   │   └── routes/              # API route handlers
│   │       ├── users.ts         # User CRUD operations
│   │       ├── trades.ts        # Trade/listing CRUD operations
│   │       ├── messages.ts      # Message operations
│   │       ├── conversations.ts # Conversation management
│   │       ├── offers.ts        # Trade offer operations
│   │       ├── ratings.ts       # User rating operations
│   │       ├── lookingFor.ts    # "Looking for" preferences
│   │       └── upload.ts        # Image upload to Supabase Storage
│   │
│   └── dist/                    # Compiled JavaScript (TypeScript output)
│
├── package.json
├── tsconfig.json
└── railway.json                 # Railway deployment config
```

### **API Endpoints**

#### **Users** (`/api/users`)
- `GET /` - List users (with search, pagination)
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PATCH /:id` - Update user profile
- `DELETE /:id` - Delete user

#### **Trades** (`/api/trades`)
- `GET /` - List trades (with filters: category, price, tags, search, etc.)
- `GET /:id` - Get trade by ID
- `POST /` - Create new trade listing
- `PATCH /:id` - Update trade listing
- `DELETE /:id` - Delete trade listing

#### **Messages** (`/api/messages`)
- `GET /` - List messages (with conversation_id filter)
- `POST /` - Send a message
- `PATCH /:id` - Update message (e.g., mark as read)
- `DELETE /:id` - Delete message

#### **Conversations** (`/api/conversations`)
- `GET /` - List conversations for a user
- `GET /:id` - Get conversation by ID
- `POST /` - Create new conversation

#### **Offers** (`/api/offers`)
- `GET /` - List offers (with filters)
- `POST /` - Create new offer
- `PATCH /:id` - Update offer (accept/reject)
- `DELETE /:id` - Delete offer

#### **Ratings** (`/api/ratings`)
- `GET /` - List ratings
- `POST /` - Create rating
- `PATCH /:id` - Update rating
- `DELETE /:id` - Delete rating

#### **Looking For** (`/api/looking-for`)
- `GET /` - Get user's "looking for" preferences
- `POST /` - Set "looking for" preferences

#### **Upload** (`/api/upload`)
- `POST /images` - Upload images to Supabase Storage
  - Accepts: `{ images: string[], userId: string }`
  - Returns: `{ urls: string[], uploaded: number, total: number }`

### **Key Technologies**
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for images)
- **Authentication**: Supabase Auth (handled client-side)
- **Middleware**: CORS, Helmet, JSON body parser (50MB limit)

### **Database Schema** (Supabase)

#### **Tables**
- `users` - User profiles
  - id, email, user_name, bio, rating, profile_picture_url
  - trade_preferences, category_preferences, interests
- `Trades` - Trade listings
  - id, offerer_user_id, title, description, price
  - category, accepted, image_urls, tags, trade_options
- `messages` - Chat messages
  - id, conversation_id, sender_id, content, created_at
- `conversations` - Chat conversations
  - id, user1_id, user2_id, created_at
- `offers` - Trade offers
  - id, trade_id, offerer_id, status, etc.
- `ratings` - User ratings
  - id, rated_user_id, rater_id, rating, comment

---

## 🔄 Data Flow

### **Authentication**
1. User signs up/logs in via Supabase Auth (client-side)
2. Frontend creates/updates user in `public.users` table via `/api/users`
3. Session stored in Supabase Auth, verified on app startup

### **Image Upload Flow**
1. User selects image → `expo-image-picker`
2. Image converted to base64 → `expo-file-system`
3. POST to `/api/upload/images` with base64 data + userId
4. Backend uploads to Supabase Storage bucket `trade-images`
5. Returns public URL
6. URL saved to user profile or trade listing

### **Trade Listing Flow**
1. User creates listing in `CreateListingScreen`
2. Images uploaded via `/api/upload/images`
3. Trade created via `POST /api/trades` with image URLs
4. Listing appears in `HomeScreen` (fetched via `GET /api/trades`)

### **Messaging Flow**
1. User views listing → taps "Contact Seller"
2. Conversation created via `POST /api/conversations`
3. Messages sent via `POST /api/messages`
4. Real-time updates (if implemented) via Supabase Realtime

---

## 📦 Dependencies

### **Frontend**
- `expo` - Expo framework
- `react-native` - React Native core
- `@supabase/supabase-js` - Supabase client
- `@react-navigation/native` - Navigation
- `expo-image-picker` - Image selection
- `expo-file-system` - File operations
- `expo-linear-gradient` - Gradient backgrounds

### **Backend**
- `express` - Web framework
- `@supabase/supabase-js` - Supabase client
- `cors` - CORS middleware
- `helmet` - Security headers
- `dotenv` - Environment variables
- `typescript` - TypeScript compiler

---

## 🚀 Deployment

### **Frontend**
- **Platform**: Expo (can deploy to iOS App Store, Google Play, or web)
- **Development**: Expo Go app or development build
- **Configuration**: `app.config.ts` for Expo settings and environment variables

### **Backend**
- **Platform**: Railway (configured in `railway.json`)
- **Build**: TypeScript compiled to JavaScript in `dist/`
- **Environment**: Uses `.env` for Supabase credentials
- **Port**: Configurable via `PORT` env variable (default: 3001)

---

## 🔐 Security

- **Authentication**: Supabase Auth (JWT tokens)
- **API Security**: Helmet.js for security headers
- **CORS**: Configured for mobile app origins
- **Data Validation**: Input validation on both frontend and backend
- **File Upload**: Size limits (50MB) and type validation
- **Database**: Row-level security via Supabase policies

---

## 📝 Notes

- **Legacy Code**: `RegisterScreen` and `OnboardingFlow` are deprecated in favor of `CreateAccountFlow`
- **State Management**: Currently using React hooks; could benefit from Context API or Redux for complex state
- **Real-time**: Supabase Realtime could be added for live messaging updates
- **Error Handling**: Basic error handling in place; could be enhanced with error boundaries
- **Testing**: No test files currently; Jest configured in backend package.json
