# Smart Incentive Payment System for Elderly Citizens

A comprehensive full-stack application designed to manage and distribute incentive payments to elderly citizens based on eligibility criteria determined by a machine learning model. The system includes an admin portal for management and oversight, and a user portal for application submission and payment tracking.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Database Schema](#database-schema)
- [ML Model](#ml-model)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Project Overview

The Smart Incentive Payment System is designed to:

- **Manage Applications**: Users submit applications with personal and financial information
- **ML-Based Eligibility**: Random Forest model predicts eligibility based on 12 key features
- **Admin Oversight**: Admins can review, approve, reject, and monitor applications
- **Payment Processing**: Eligible users receive incentive payments through the system
- **Data Insights**: SHAP interpretability shows which factors influence eligibility decisions

### Key Features

- **User Portal**: Registration, login, application submission, payment claiming, history tracking
- **Admin Portal**: Dashboard, user management, application oversight, payment monitoring, system settings, ML insights
- **ML Integration**: Random Forest model with SHAP explainability
- **PostgreSQL Database**: Secure data storage with proper indexing
- **JWT Authentication**: Secure token-based authentication for both users and admins
- **Responsive Design**: Modern UI with React + Tailwind CSS + ShadCN UI

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: ShadCN UI + Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Routing**: Wouter
- **HTTP Client**: Axios
- **Notifications**: Sonner

### Backend

- **Framework**: Flask
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL (with Supabase)
- **ML**: Scikit-learn, Pandas, NumPy
- **Explainability**: SHAP
- **Authentication**: Flask-JWT-Extended
- **Deployment**: Gunicorn + Render

## 📁 Project Structure

```
smart-incentive-system/
├── elderly-incentive-frontend/          # React + Vite frontend
│   ├── client/
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── admin/               # Admin pages
│   │   │   │   │   ├── AdminLogin.tsx
│   │   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   │   ├── AdminUsers.tsx
│   │   │   │   │   ├── AdminApplications.tsx
│   │   │   │   │   ├── AdminPayments.tsx
│   │   │   │   │   ├── AdminSettings.tsx
│   │   │   │   │   └── AdminMLInsights.tsx
│   │   │   │   ├── user/                # User pages
│   │   │   │   │   ├── UserRegister.tsx
│   │   │   │   │   ├── UserLogin.tsx
│   │   │   │   │   ├── UserDashboard.tsx
│   │   │   │   │   ├── UserProfile.tsx
│   │   │   │   │   ├── UserApplications.tsx
│   │   │   │   │   ├── UserApplicationHistory.tsx
│   │   │   │   │   ├── UserEligibilityResult.tsx
│   │   │   │   │   └── UserPayment.tsx
│   │   │   │   ├── Home.tsx             # Landing page
│   │   │   │   └── NotFound.tsx         # 404 page
│   │   │   ├── components/              # Reusable components
│   │   │   ├── contexts/                # React contexts
│   │   │   ├── lib/                     # Utilities and API client
│   │   │   ├── App.tsx                  # Main app component
│   │   │   ├── main.tsx                 # Entry point
│   │   │   └── index.css                # Global styles
│   │   ├── public/                      # Static assets
│   │   └── index.html                   # HTML template
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env.example                     # Environment variables template
│
├── smart_incentive_backend/             # Flask backend
│   ├── app/
│   │   ├── __init__.py                  # App factory
│   │   ├── models.py                    # Database models
│   │   ├── ml_service.py                # ML model service
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── routes.py                # Auth endpoints
│   │   ├── admin/
│   │   │   ├── __init__.py
│   │   │   └── routes.py                # Admin endpoints
│   │   └── user/
│   │       ├── __init__.py
│   │       └── routes.py                # User endpoints
│   ├── ml_model/
│   │   ├── elderly_incentive_rf_model.pkl  # Trained model
│   │   └── elderly_incentive_dataset.csv   # Training dataset
│   ├── migrations/                      # Database migrations
│   ├── config.py                        # Configuration
│   ├── run.py                           # Local development server
│   ├── wsgi.py                          # Gunicorn entry point
│   ├── init_db.py                       # Database initialization
│   ├── requirements.txt                 # Python dependencies
│   ├── render.yaml                      # Render deployment config
│   ├── .env.example                     # Environment variables template
│   └── README.md                        # Backend-specific docs
│
├── .gitignore                           # Git ignore rules
└── README.md                            # This file
```

## 📦 Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.9 or higher
- **PostgreSQL**: v12 or higher (or Supabase account)
- **Git**: For version control
- **pnpm**: Package manager for Node.js

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/busayo-dev/smart-incentive-system.git
cd smart-incentive-system
```

### 2. Backend Setup

```bash
cd smart_incentive_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd elderly-incentive-frontend

# Install dependencies
pnpm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `smart_incentive_backend` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres.jujyumroxnbfkljmiywi:piponsuhu12345@aws-0-eu-west-1.pooler.supabase.com:5432/postgres

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

### Frontend Configuration

Create a `.env` file in the `elderly-incentive-frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## 🏃 Running Locally

### Start Backend Server

```bash
cd smart_incentive_backend

# Activate virtual environment (if not already activated)
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Initialize database (first time only)
python init_db.py

# Start development server
python run.py

# Server will run on http://localhost:5000
```

### Start Frontend Server

In a new terminal:

```bash
cd elderly-incentive-frontend

# Start development server
pnpm dev

# Server will run on http://localhost:3000
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Test Credentials

**Admin Accounts:**

- Email: admin1@example.com | Password: adminpassword123
- Email: admin2@example.com | Password: adminpassword456

**Test User Accounts:**

- Username: testuser1 | Password: password123
- Username: testuser2 | Password: password123
- Username: testuser3 | Password: password123
- Username: john_doe | Password: password123
- Username: jane_smith | Password: password123
- Username: robert_johnson | Password: password123
- Username: maria_garcia | Password: password123
- Username: david_brown | Password: password123

## 🌐 Deployment

### Deploy to Render

#### Backend Deployment

1. **Create Render Account**: Sign up at https://render.com

2. **Create PostgreSQL Database**:
   - Create a new PostgreSQL database on Render or use Supabase
   - Copy the connection string

3. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: smart-incentive-backend
     - **Environment**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT wsgi:app`
     - **Region**: Choose closest to your users

4. **Set Environment Variables**:
   - Go to "Environment" tab
   - Add all variables from `.env.example`
   - Ensure `DATABASE_URL` points to your PostgreSQL database

5. **Deploy**: Render will automatically deploy when you push to GitHub

#### Frontend Deployment

1. **Create Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: smart-incentive-frontend
     - **Build Command**: `cd elderly-incentive-frontend && pnpm install && pnpm build`
     - **Publish Directory**: `elderly-incentive-frontend/dist`

2. **Set Environment Variables**:
   - Add `VITE_API_URL` pointing to your backend URL

3. **Deploy**: Render will automatically deploy when you push to GitHub

### Environment Variables for Production

**Backend (.env)**:

```env
DATABASE_URL=your-production-database-url
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=generate-a-strong-secret-key
JWT_SECRET_KEY=generate-a-strong-jwt-secret
CORS_ORIGINS=https://your-frontend-domain.com
```

**Frontend (.env)**:

```env
VITE_API_URL=https://your-backend-domain.com
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User

```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: { "message": "User registered successfully" }
```

#### Login

```
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword"
}

Response: {
  "access_token": "jwt-token-here",
  "user_role": "user"
}
```

#### Logout

```
POST /auth/logout
Authorization: Bearer {access_token}

Response: { "message": "Logged out successfully" }
```

### User Endpoints

#### Submit Application

```
POST /user/applications
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "age": 75,
  "income": 35000,
  "employment_status": "Unemployed",
  "housing_status": "Rented",
  "health_status": "Poor",
  "disability": "Yes",
  "chronic_illness": "Yes",
  "caregiver": "No",
  "family_support": "Low",
  "healthcare_access": "Difficult",
  "national_id": "Yes",
  "location": "Rural"
}

Response: {
  "application_id": 1,
  "ml_prediction": "Eligible",
  "probability": 0.91,
  "confidence": "High"
}
```

#### Get User Applications

```
GET /user/applications
Authorization: Bearer {access_token}

Response: [
  {
    "id": 1,
    "submission_date": "2024-05-19T10:30:00",
    "status": "approved",
    "ml_prediction": "Eligible",
    "probability": 0.91,
    "confidence": "High"
  }
]
```

#### Claim Incentive

```
POST /user/applications/{application_id}/claim-incentive
Authorization: Bearer {access_token}

Response: {
  "payment_id": 1,
  "amount": 100.00,
  "status": "completed",
  "transaction_id": "TXN-2024-05-19-001"
}
```

### Admin Endpoints

#### Get Dashboard Stats

```
GET /admin/dashboard
Authorization: Bearer {access_token}

Response: {
  "total_users": 50,
  "total_applications": 120,
  "approved_applications": 85,
  "rejected_applications": 35,
  "total_payments": 8500.00
}
```

#### Get All Users

```
GET /admin/users
Authorization: Bearer {access_token}

Response: [
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "is_blocked": false,
    "created_at": "2024-05-19T10:30:00"
  }
]
```

#### Block User

```
PUT /admin/users/{user_id}/block
Authorization: Bearer {access_token}

Response: { "message": "User blocked successfully" }
```

#### Get Applications (with filters)

```
GET /admin/applications?status=approved&ml_prediction=Eligible
Authorization: Bearer {access_token}

Response: [
  {
    "id": 1,
    "user_id": 5,
    "status": "approved",
    "ml_prediction": "Eligible",
    "submission_date": "2024-05-19T10:30:00"
  }
]
```

#### Update Application Status

```
PUT /admin/applications/{application_id}/status
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "approved",
  "admin_notes": "Application approved after review"
}

Response: { "message": "Application status updated" }
```

#### Get Payments

```
GET /admin/payments
Authorization: Bearer {access_token}

Response: [
  {
    "id": 1,
    "application_id": 1,
    "amount": 100.00,
    "status": "completed",
    "transaction_id": "TXN-2024-05-19-001",
    "created_at": "2024-05-19T10:30:00"
  }
]
```

#### Get System Settings

```
GET /admin/settings
Authorization: Bearer {access_token}

Response: {
  "max_applications_per_user": 3,
  "incentive_amount": 100.00,
  "application_period_enabled": true
}
```

#### Update System Settings

```
POST /admin/settings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "max_applications_per_user": 5,
  "incentive_amount": 150.00,
  "application_period_enabled": true
}

Response: { "message": "Settings updated successfully" }
```

#### Get ML Interpretability

```
GET /admin/ml-interpretability
Authorization: Bearer {access_token}

Response: {
  "feature_importances": {
    "age": 0.25,
    "income": 0.20,
    "health_status": 0.18,
    ...
  }
}
```

## 🤖 ML Model

### Model Details

- **Algorithm**: Random Forest Classifier
- **Training Data**: 1000+ elderly citizen records
- **Features**: 12 key indicators (age, income, employment, housing, health, disability, chronic illness, caregiver, family support, healthcare access, national ID, location)
- **Accuracy**: ~85-90% on test set
- **Explainability**: SHAP values for feature importance

### Model Features

The ML model uses these 12 features to predict eligibility:

1. **age** (integer): Age of applicant (60+)
2. **income** (float): Annual income in dollars
3. **employment_status** (categorical): Employed / Unemployed
4. **housing_status** (categorical): Owned / Rented / Homeless
5. **health_status** (categorical): Good / Fair / Poor
6. **disability** (categorical): Yes / No
7. **chronic_illness** (categorical): Yes / No
8. **caregiver** (categorical): Yes / No
9. **family_support** (categorical): Low / Medium / High
10. **healthcare_access** (categorical): Easy / Difficult
11. **national_id** (categorical): Yes / No
12. **location** (categorical): Urban / Rural

### Eligibility Criteria

- **Age Requirement**: Must be 60 years or older
- **Prediction Threshold**: Probability ≥ 0.5 = Eligible
- **Confidence Levels**:
  - High: |probability - 0.5| > 0.3
  - Medium: |probability - 0.5| ≤ 0.3

### Model Interpretability

The system uses SHAP (SHapley Additive exPlanations) to explain which features most influence eligibility decisions. Admins can view:

- Global feature importance (which features matter most overall)
- Local feature impact (why a specific application was approved/rejected)
- Feature interaction effects

## 🧪 Testing

### Backend Testing

```bash
cd smart_incentive_backend

# Run test API script
python test_api.py

# This will test:
# - User registration and login
# - Application submission
# - ML prediction
# - Admin endpoints
# - Payment processing
```

### Frontend Testing

```bash
cd elderly-incentive-frontend

# Run type checking
pnpm check

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Manual Testing Checklist

**User Flow:**

- [ ] Register new account
- [ ] Login with credentials
- [ ] View dashboard and statistics
- [ ] Submit application
- [ ] View eligibility result
- [ ] Claim incentive (if eligible)
- [ ] View payment confirmation
- [ ] Check application history

**Admin Flow:**

- [ ] Login with admin credentials
- [ ] View dashboard statistics
- [ ] View all users
- [ ] Block/unblock users
- [ ] View applications
- [ ] Update application status
- [ ] View payments
- [ ] View ML insights
- [ ] Update system settings

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**

```
Error: could not connect to server: Connection refused

Solution:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify database credentials
4. Test connection: psql <DATABASE_URL>
```

**ML Model Not Loading**

```
Error: FileNotFoundError: elderly_incentive_rf_model.pkl

Solution:
1. Ensure ml_model directory exists
2. Check model file is in smart_incentive_backend/ml_model/
3. Verify file permissions
```

**JWT Token Errors**

```
Error: 422 Unprocessable Entity

Solution:
1. Check token format in Authorization header
2. Verify JWT_SECRET_KEY is set
3. Ensure token hasn't expired
4. Check token is for correct user role
```

### Frontend Issues

**API Connection Error**

```
Error: Failed to fetch from http://localhost:5000

Solution:
1. Ensure backend is running on port 5000
2. Check VITE_API_URL in .env
3. Verify CORS is enabled in backend
4. Check browser console for specific error
```

**Login Redirects to Admin Page**

```
Issue: User login redirects to admin login

Solution:
1. Clear browser localStorage
2. Check user role is set correctly
3. Verify token is stored with correct key
4. Check UserAuthContext implementation
```

**Dashboard Shows No Data**

```
Issue: Dashboard statistics show 0

Solution:
1. Ensure user is logged in
2. Check API token is valid
3. Verify user has applications
4. Check browser console for API errors
```

## 📝 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Applications Table

```sql
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  age INTEGER NOT NULL,
  income DECIMAL(10, 2),
  employment_status VARCHAR(50),
  housing_status VARCHAR(50),
  health_status VARCHAR(50),
  disability VARCHAR(10),
  chronic_illness VARCHAR(10),
  caregiver VARCHAR(10),
  family_support VARCHAR(50),
  healthcare_access VARCHAR(50),
  national_id VARCHAR(10),
  location VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  ml_prediction VARCHAR(50),
  probability DECIMAL(5, 4),
  confidence VARCHAR(50),
  admin_notes TEXT,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Payments Table

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  transaction_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## 🔐 Security

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is configured to allow only authorized origins
- SQL injection is prevented using SQLAlchemy ORM
- Input validation is performed on all endpoints
- Sensitive data is not logged

## 📊 Performance Considerations

- Database queries are optimized with proper indexing
- Frontend uses code splitting for faster initial load
- API responses are cached where appropriate
- ML model predictions are cached for identical inputs
- Images and assets are optimized and lazy-loaded

## 🚀 Future Enhancements

- Email notifications for application status updates
- SMS notifications for payment confirmations
- PDF export for applications and receipts
- Application resubmission workflow
- Batch processing for admin actions
- Advanced analytics and reporting
- Multi-language support
- Mobile app (React Native)
- Two-factor authentication
- API rate limiting and throttling
