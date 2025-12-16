# BruinCoin - Feature Highlights Presentation

---

## Slide 1: Title Slide
# BruinCoin
## UCLA Student Trading Platform
**Mobile App Feature Highlights**

---

## Slide 2: Overview
# What is BruinCoin?
- **Campus Marketplace** for UCLA students
- Buy, sell, and trade items within the UCLA community
- Secure, user-friendly mobile app connecting students
- **iOS & Android** compatible

---

## Slide 3: Mobile App Overview
# Mobile App Features
### React Native Mobile App
- Cross-platform iOS & Android
- Modern, intuitive user interface
- Seamless user experience
- Native mobile performance

---

## Slide 4: Authentication & Onboarding
# 🔐 Authentication & Onboarding

### **Welcome & Login Flow**
- Beautiful welcome screen with brand identity
- Secure UCLA email authentication
- Personalized welcome back screen

### **Account Creation Flow**
- 8-step guided onboarding process
- Email & password registration
- Profile picture upload
- Username selection (@username)
- Bio and interests customization
- Trade preferences setup
- Category interests selection

---

## Slide 5: Home & Discovery
# 🏠 Home & Discovery

### **Home Screen**
- **New Listings** - Latest trade postings
- **Recommended** - Personalized suggestions
- **Quick Navigation** - Easy access to all features
- **Image Previews** - Visual listing cards

### **Browse Experience**
- Scrollable feed of available trades
- Tap to view full listing details
- See all listings with filters

---

## Slide 6: Search & Filter
# 🔍 Search & Filter

### **Advanced Search**
- Text search across titles, descriptions, categories
- Category filtering
- Price range filters
- Tag-based filtering
- Trade type filters (Buying/Selling/Trading)

### **Smart Results**
- Real-time search results
- Filter combinations
- Pagination support

---

## Slide 7: Listing Management
# 📝 Listing Management

### **Create Listings**
- Multi-step listing creation
- Image upload (up to multiple images)
- Title, description, price
- Category and tag selection
- Trade options (Buying/Selling/Trading)
- Preview before publishing

### **Manage Listings**
- View your own listings
- Edit listing details
- Delete listings
- Track listing status

---

## Slide 8: Profile & Social
# 👤 Profile & Social

### **User Profiles**
- View your own profile
- View other users' profiles
- Profile pictures
- Username display (@username)
- Bio and interests
- Rating display
- User's listings showcase

### **Profile Features**
- Edit profile information
- Update profile picture
- Modify bio and interests
- View rating and reviews

---

## Slide 9: Messaging
# 💬 Messaging System

### **Conversations**
- List of all conversations
- Contact names and avatars
- Last message preview
- Unread message indicators

### **Chat Interface**
- Real-time message display
- Send text messages
- View conversation history
- Message timestamps
- Contact information

---

## Slide 10: UI/UX Features
# 🎨 UI/UX Features

### **Modern Design**
- Clean, minimalist interface
- Gradient backgrounds
- Smooth animations
- Consistent color scheme

### **User Experience**
- Bottom navigation bar
- Intuitive screen transitions
- Keyboard dismissal on tap
- Loading states and indicators
- Error handling with alerts
- Safe area handling for all devices

---

## Slide 11: Backend API Overview
# Backend API Features
### Express.js REST API
- Powers the mobile app
- Scalable architecture
- TypeScript for type safety
- Secure API endpoints
- Mobile-optimized responses

---

## Slide 12: User Management API
# 👥 User Management API

### **Endpoints**
- `GET /api/users` - List users with search
- `GET /api/users/:id` - Get user profile
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update profile
- `DELETE /api/users/:id` - Delete user

### **Features**
- User profile management
- Search users by name/email
- Pagination support
- Profile picture URL storage
- Trade preferences storage
- Category preferences storage

---

## Slide 13: Trade Listings API
# 📦 Trade Listings API

### **Endpoints**
- `GET /api/trades` - List trades with filters
- `GET /api/trades/:id` - Get trade details
- `POST /api/trades` - Create new listing
- `PATCH /api/trades/:id` - Update listing
- `DELETE /api/trades/:id` - Delete listing

### **Advanced Filtering**
- Filter by category
- Filter by trade type
- Price range filtering
- Tag-based filtering
- Search by text
- Filter by user
- Accepted status filtering

---

## Slide 14: Messaging API
# 💬 Messaging API

### **Endpoints**
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### **Conversations**
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation
- `POST /api/conversations` - Create conversation

### **Features**
- Message threading
- Conversation management
- Sender/receiver tracking
- Timestamp tracking

---

## Slide 15: Image Upload API
# 📸 Image Upload API

### **Endpoint**
- `POST /api/upload/images` - Upload images

### **Features**
- Base64 image encoding
- Multiple image upload support
- Automatic file type detection
- Unique filename generation
- Supabase Storage integration
- Public URL generation
- 50MB file size limit

### **Use Cases**
- Profile picture uploads
- Listing image uploads
- Multiple images per listing

---

## Slide 16: Additional APIs
# 🔧 Additional APIs

### **Offers API**
- Create trade offers
- Accept/reject offers
- Track offer status
- Filter offers by trade/user

### **Ratings API**
- Rate users after trades
- View user ratings
- Calculate average ratings
- Rating comments

### **Looking For API**
- Set "looking for" preferences
- Match users by preferences
- Preference management

---

## Slide 17: Database Architecture
# 🗄️ Database Architecture

### **Supabase PostgreSQL**
- **Users Table** - User profiles and preferences
- **Trades Table** - Trade listings
- **Messages Table** - Chat messages
- **Conversations Table** - Chat threads
- **Offers Table** - Trade offers
- **Ratings Table** - User ratings

### **Storage**
- **Supabase Storage** - Image file storage
- **Bucket:** trade-images
- **Public URLs** - Direct image access

---

## Slide 18: Security Features
# 🔒 Security Features

### **Authentication**
- Supabase Auth (JWT tokens)
- Email/password authentication
- Session management
- Automatic token refresh

### **API Security**
- Helmet.js security headers
- CORS protection
- Input validation
- SQL injection protection
- File upload size limits
- File type validation

### **Database Security**
- Row-Level Security (RLS)
- Parameterized queries
- User data isolation

---

## Slide 19: Performance & Scalability
# ⚡ Performance & Scalability

### **Backend**
- Efficient database queries
- Pagination for large datasets
- Indexed database columns
- Optimized API responses

### **Frontend**
- Image optimization
- Lazy loading
- Efficient state management
- Smooth animations

### **Infrastructure**
- Railway deployment
- Auto-scaling capabilities
- CDN for static assets

---

## Slide 20: Technology Stack Summary
# 🛠️ Mobile App Technology Stack

### **Mobile App (Frontend)**
- React Native + Expo
- TypeScript
- Supabase Client
- React Navigation
- iOS & Android support

### **Backend API**
- Node.js + Express.js
- TypeScript
- Supabase (PostgreSQL)
- Railway Deployment

### **Services**
- Supabase (Database, Storage, Auth)
- Railway (API Hosting)

---

## Slide 21: Key Highlights
# ✨ Key Highlights

### **User Experience**
- ✅ Smooth 8-step onboarding
- ✅ Intuitive navigation
- ✅ Beautiful UI design
- ✅ Fast search and filtering

### **Functionality**
- ✅ Complete trade management
- ✅ Real-time messaging
- ✅ Profile customization
- ✅ Image uploads

### **Technical**
- ✅ Type-safe codebase
- ✅ RESTful API design
- ✅ Secure authentication
- ✅ Scalable architecture

---

## Slide 22: Thank You
# Thank You!
## Questions?

**BruinCoin**
UCLA Student Trading Platform

---

## Presentation Notes

### Slide Transitions
- Use fade transitions between slides
- Keep animations subtle and professional

### Design Recommendations
- Use BruinCoin brand colors (blue theme)
- Include screenshots of actual app screens
- Add diagrams for API architecture
- Show database schema diagram

### Key Points to Emphasize
1. **User-Centric Design** - Focus on student needs
2. **Security** - Secure authentication and data protection
3. **Scalability** - Built to handle growth
4. **Modern Stack** - Latest technologies and best practices

### Visual Elements to Add
- Screenshots of key screens
- API endpoint diagram
- Database schema diagram
- User flow diagrams
- Architecture diagram

