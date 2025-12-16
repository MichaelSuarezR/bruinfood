# BruinCoin

A modern cryptocurrency application built with Next.js frontend and Node.js backend, powered by Supabase.

## 🏗️ Architecture

- **Frontend**: Next.js with v0 (deployed on Vercel)
- **Backend**: Node.js/Express API (deployed on Render)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Version Control**: Separate Git repositories with branch-based workflow

## 🌳 Git Workflow

This project uses a **single repository** with separate branch workflows for frontend and backend:

### Repository Structure
- `bruinCoin/` - Single repository containing both frontend and backend
- `bruinCoin/frontend/` - Frontend code (Next.js)
- `bruinCoin/backend/` - Backend code (Node.js/Express)

### Branch Structure
- `main` - Default branch (contains both frontend and backend)
- `frontend-main` - Production frontend branch
- `frontend-dev` - Development frontend branch
- `frontend-feature/*` - Frontend feature branches (cloned off `frontend-dev`)
- `backend-main` - Production backend branch
- `backend-dev` - Development backend branch
- `backend-feature/*` - Backend feature branches (cloned off `backend-dev`)

### Workflow
**For Frontend Development:**
1. Create feature branches from `frontend-dev`: `git checkout -b frontend-feature/your-feature`
2. Develop features in feature branches
3. Merge feature branches into `frontend-dev` for testing
4. Merge `frontend-dev` into `frontend-main` for production releases

**For Backend Development:**
1. Create feature branches from `backend-dev`: `git checkout -b backend-feature/your-feature`
2. Develop features in feature branches
3. Merge feature branches into `backend-dev` for testing
4. Merge `backend-dev` into `backend-main` for production releases

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Git
- Supabase account
- Vercel account (for frontend deployment)
- Render account (for backend deployment)

### Local Development

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd bruinCoin
   ```

2. **Backend Setup**
   ```bash
   git checkout backend-dev
   cd backend
   npm install
   cp .env.example .env
   # Fill in your Supabase credentials in .env
   npm run dev
   ```

3. **Frontend Setup** (in separate terminal)
   ```bash
   git checkout frontend-dev
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Fill in your Supabase credentials in .env.local
   npm run dev
   ```

## 📁 Project Structure

```
bruinCoin/                  # Single Git repository
├── .git/                  # Git repository
├── frontend/              # Frontend code (Next.js)
│   ├── src/
│   │   ├── app/            # Next.js 13+ app directory
│   │   ├── components/     # Reusable components
│   │   ├── lib/            # Utility functions
│   │   └── styles/         # Global styles
│   ├── .env.local.example  # Environment variables template
│   ├── next.config.js
│   ├── package.json
│   └── README.md
├── backend/               # Backend code (Node.js/Express)
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   ├── server.js           # Entry point
│   └── README.md
└── README.md              # Main project documentation
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Mobile (.env)
Copy `frontend/mobile/.env.example` to `frontend/mobile/.env` and set:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## 🗄️ Database Schema (Supabase)

### Users Table
- `id` (uuid, primary key)
- `email` (text, unique)
- `username` (text, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Wallets Table
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `balance` (decimal)
- `currency` (text, default: 'BRUIN')
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Transactions Table
- `id` (uuid, primary key)
- `from_wallet_id` (uuid, foreign key)
- `to_wallet_id` (uuid, foreign key)
- `amount` (decimal)
- `type` (text: 'transfer', 'deposit', 'withdrawal')
- `status` (text: 'pending', 'completed', 'failed')
- `created_at` (timestamp)

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/.next`
4. Set root directory: `frontend`
5. Add environment variables in Vercel dashboard
6. Deploy from `frontend-main` branch

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Set root directory: `backend`
5. Add environment variables in Render dashboard
6. Deploy from `backend-main` branch

## 🔒 Security Best Practices

- ✅ Environment variables properly separated (client vs server)
- ✅ Supabase RLS (Row Level Security) enabled
- ✅ API rate limiting implemented
- ✅ Input validation and sanitization
- ✅ CORS properly configured
- ✅ JWT tokens for authentication
- ✅ No secrets exposed in client-side code

## 🛠️ Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run linter
```

### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm start          # Start production server
npm run lint       # Run linter
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Wallets
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets` - Create new wallet
- `GET /api/wallets/:id` - Get specific wallet

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get specific transaction

## 🤝 Contributing

### For Frontend Development
1. Switch to frontend dev branch: `git checkout frontend-dev`
2. Create a feature branch: `git checkout -b frontend-feature/your-feature-name`
3. Make your changes in the `frontend/` directory
4. Test thoroughly
5. Create a pull request to `frontend-dev`
6. After review and testing, merge to `frontend-main` for production

### For Backend Development
1. Switch to backend dev branch: `git checkout backend-dev`
2. Create a feature branch: `git checkout -b backend-feature/your-feature-name`
3. Make your changes in the `backend/` directory
4. Test thoroughly
5. Create a pull request to `backend-dev`
6. After review and testing, merge to `backend-main` for production

## 📄 License

MIT License - see LICENSE file for details
