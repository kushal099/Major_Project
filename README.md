# 🏥 FamilyCare - Healthcare Management Platform

A comprehensive full-stack MERN application for managing family healthcare with role-based access, appointment scheduling, prescription management, and AI-powered symptom checking.

---

## 🎯 Project Overview

**FamilyCare** is a modern healthcare platform that enables:
- **Patients** to book appointments, view prescriptions, and check symptoms
- **Doctors** to manage appointments and create detailed prescriptions
- **Family Admins** to oversee family members' health records

### **Key Features:**
✅ JWT-based authentication with secure password hashing  
✅ Role-based access control (Patient, Doctor, Family Admin)  
✅ Smart appointment booking with validation rules  
✅ Complete prescription workflow with medications tracking  
✅ Email-based family member lookup and management  
✅ AI-powered symptom analysis (Google Gemini)  
✅ Responsive UI with medical-themed design  
✅ Legal disclaimer for educational project  

---

## 🛠️ Tech Stack

### **Backend:**
- **Node.js** + **Express** 4.21.1
- **MongoDB Atlas** + **Mongoose** 8.6.1 (with retry logic)
- **JWT** for authentication
- **bcryptjs** for password security
- **Google Gemini AI** 2.0 Flash Experimental
- **CORS** enabled
- **Axios** for external API calls

### **Frontend:**
- **React** 18 + **Vite**
- **React Router** v6
- **Tailwind CSS** v4
- **AuthContext** for state management

---

## 📁 Project Structure

```
Family_Health_Care_WebApp/
├── Backend/
│   └── server/
│       ├── models/           # MongoDB schemas
│       │   ├── User.js
│       │   ├── Appointment.js
│       │   ├── Prescription.js
│       │   └── FamilyMember.js
│       ├── routes/           # API endpoints
│       │   ├── auth.js
│       │   ├── appointments.js
│       │   ├── prescriptions.js
│       │   ├── family.js
│       │   └── ai.js
│       ├── middleware/
│       │   └── auth.js       # JWT verification
│       ├── index.js          # Server entry point
│       ├── .env              # Environment variables
│       └── package.json
│
└── Frontend/
    └── client/
        ├── src/
        │   ├── components/   # Reusable components
        │   │   ├── Navbar.jsx
        │   │   ├── Footer.jsx
        │   │   └── ProtectedRoute.jsx
        │   ├── pages/        # Route pages
        │   │   ├── HomePage.jsx
        │   │   ├── LoginPage.jsx
        │   │   ├── RegisterPage.jsx
        │   │   ├── DashboardPage.jsx
        │   │   ├── DoctorDashboardPage.jsx
        │   │   ├── FamilyAdminPage.jsx
        │   │   ├── AboutPage.jsx
        │   │   └── ContactPage.jsx
        │   ├── context/
        │   │   └── AuthContext.jsx
        │   ├── layouts/
        │   │   └── MainLayout.jsx
        │   ├── App.jsx
        │   └── main.jsx
        ├── index.html
        ├── package.json
        └── vite.config.js
```

---

## 🚀 Installation & Setup

### **Prerequisites:**
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### **1. Clone Repository:**
```bash
git clone <repository-url>
cd Family_Health_Care_WebApp
```

### **2. Backend Setup:**
```bash
cd Backend/server
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` with your credentials:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/family_healthcare?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-exp
PORT=5000
```

> **Tip:** Generate a strong JWT secret with: `openssl rand -base64 32`

### **3. Frontend Setup:**
```bash
cd Frontend/client
npm install
```

### **4. Start Servers:**

**Terminal 1 - Backend:**
```bash
cd Backend/server
npm run dev
```
> **Note:** Backend will retry MongoDB connection 3 times and start server even if database is unavailable.

**Terminal 2 - Frontend:**
```bash
cd Frontend/client
npm run dev
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### **5. MongoDB Atlas Setup:**
> **Important:** Add your current IP address to MongoDB Atlas Network Access:
1. Go to https://cloud.mongodb.com
2. Select your cluster → Network Access
3. Click "Add IP Address"
4. Choose "Add Current IP Address" or "Allow Access from Anywhere" (for testing)
5. Save and wait 1-2 minutes for changes to propagate

---

## 👥 User Roles

### **1. Patient:**
- Register and login
- Book appointments with doctors
- View appointment history
- Access prescriptions
- Use AI symptom checker
- Update profile

### **2. Doctor:**
- View assigned appointments
- Approve or reject appointments
- Create prescriptions with medications
- Mark appointments as completed
- Access doctor dashboard

### **3. Family Admin:**
- Add family members by email
- View member health records
- Book appointments for members
- Access member prescriptions
- Manage family dashboard

---

## 📋 API Endpoints

### **Authentication:**
```
POST /api/auth/register   # Register new user
POST /api/auth/login      # Login user
```

### **Appointments:**
```
GET  /api/appointments/my              # User's appointments
POST /api/appointments                 # Create appointment
GET  /api/appointments/doctor/my       # Doctor's appointments (FIXED: now returns appointments)
PATCH /api/appointments/:id/status     # Update status
GET  /api/appointments/family/:memberId # Family member appointments
POST /api/appointments/family/:memberId # Create for family member
```

### **Prescriptions:**
```
GET  /api/prescriptions/my              # User's prescriptions
POST /api/prescriptions/:appointmentId  # Create prescription (FIXED: doctor validation)
GET  /api/prescriptions/family/:memberId # Family member prescriptions
POST /api/prescriptions/family/:memberId # Create prescription for family member
```

### **Doctors:**
```
GET  /api/doctors                      # List all doctors (NEW: dynamic list)
GET  /api/doctors/family-admins        # List family admins
```

### **Family Management:**
```
POST /api/family          # Add family member
GET  /api/family          # List family members
```

### **AI Symptom Check:**
```
POST /api/ai/symptom-check # Analyze symptoms with Gemini AI (FIXED: working model)
GET  /api/ai/ping          # Test Gemini API connectivity
```

### **Health Check:**
```
GET  /api/health           # Server health status
```

---

## 🎨 Design System

### **Color Palette:**
```css
primary: #2C3E50      /* Dark blue-gray for text */
accent: #27AE60       /* Medical green for actions */
accentLight: #E8F5E9  /* Light green background */
bgLight: #F8F9FA      /* Off-white page background */
```

### **Key UI Components:**
- Responsive navbar with role-aware links
- Profile dropdown with user info
- Status badges (pending, approved, rejected, completed)
- Modal dialogs for details and forms
- Card-based layouts for data display
- Footer with legal disclaimer

---

## ✅ Features Implemented

### **Core Functionality:**
- [x] JWT authentication with role-based access
- [x] **Enhanced auth middleware** - Fetches complete user data including name and email
- [x] Patient appointment booking
- [x] **Doctor appointment dashboard** - Shows all appointments for logged-in doctor
- [x] Doctor appointment approval/rejection
- [x] **Prescription creation** - Fixed validation to work with doctor names
- [x] Family member management by email
- [x] **AI symptom analysis** - Working Gemini 2.0 Flash integration
- [x] **Dynamic doctor list** - Frontend fetches doctors from database
- [x] **Auto Dr. prefix** - Automatically adds "Dr." to doctor names during registration
- [x] Appointment validation rules:
  - No past date bookings
  - No duplicate pending/approved appointments
  - Prescriptions can be created for any appointment status
- [x] **MongoDB retry logic** - Server starts even if database connection fails

### **UI/UX:**
- [x] Marketing homepage with services, testimonials
- [x] Responsive design (mobile, tablet, desktop)
- [x] Form validations with error messages
- [x] Date picker with min date restrictions
- [x] Legal disclaimer footer
- [x] Professional medical theme

### **Recent Improvements (Nov 2025):**
- [x] Fixed doctor appointments not showing (auth middleware issue)
- [x] Fixed prescription creation forbidden error
- [x] Updated Gemini AI to working model version
- [x] Implemented backend resilience with MongoDB retry
- [x] Added dynamic doctor endpoint for patient booking

---

## 🔐 Security Features

- ✅ **Password Hashing:** bcryptjs with salt rounds
- ✅ **JWT Tokens:** Secure authentication
- ✅ **Protected Routes:** Middleware authentication
- ✅ **Role Checks:** Endpoint-level authorization
- ✅ **CORS Configuration:** Restricted origins
- ✅ **Environment Variables:** Sensitive data protection

---

## 📊 Database Schema

### **User Model:**
```javascript
{
  name: String,
  email: String (unique, required),
  password: String (hashed),
  role: Enum ['patient', 'doctor', 'family_admin'],
  dateOfBirth: Date,
  gender: String,
  createdAt: Date
}
```

### **Appointment Model:**
```javascript
{
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  doctorName: String,
  date: Date,
  time: String,
  reason: String,
  status: Enum ['pending', 'approved', 'rejected', 'completed'],
  nextAppointmentDate: Date,
  createdAt: Date
}
```

### **Prescription Model:**
```javascript
{
  appointmentId: ObjectId (unique, ref: Appointment),
  patientId: ObjectId (ref: User),
  doctorId: ObjectId (ref: User),
  notes: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  followUpDate: Date,
  createdAt: Date
}
```

### **FamilyMember Model:**
```javascript
{
  adminId: ObjectId (ref: User),
  userId: String (auto-generated, unique), // e.g., ABC123
  userEmail: String (required),
  name: String,
  username: String,
  relation: String,
  dateOfBirth: Date,
  gender: String,
  createdAt: Date
}
```

---

## 📖 Documentation

- **[DEMO_GUIDE.md](./DEMO_GUIDE.md)** - Step-by-step demo instructions
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Detailed feature status

---

## 🐛 Known Issues & Recent Fixes

### **✅ FIXED - Doctor Appointments Not Showing:**
- **Issue:** Doctor dashboard showed 0 appointments despite database having appointments
- **Root Cause:** Auth middleware only extracted `id` and `role` from JWT, not `name` field
- **Solution:** Modified middleware to fetch full user from database and attach complete user info
- **Status:** RESOLVED ✅

### **✅ FIXED - Prescription Creation Error:**
- **Issue:** "Forbidden: not your appointment" error when doctors tried to create prescriptions
- **Root Cause:** Validation checked `doctorId` but appointments use `doctorName` field
- **Solution:** Changed validation from `appt.doctorId !== requester.id` to `appt.doctorName !== requester.name`
- **Status:** RESOLVED ✅

### **✅ FIXED - Gemini AI Integration:**
- **Issue:** Invalid model name `gemini-2.5-flash` causing API failures
- **Root Cause:** Model version doesn't exist, wrong API endpoint version
- **Solution:** Updated to `gemini-2.0-flash-exp` with `/v1beta/` endpoint
- **Status:** RESOLVED ✅ (Verified working)

### **✅ FIXED - Backend Startup Issues:**
- **Issue:** Backend crashed immediately if MongoDB connection failed
- **Root Cause:** No retry logic or fallback mechanism
- **Solution:** Implemented 3-retry connection logic with server starting even without MongoDB
- **Status:** RESOLVED ✅

### **⚠️ MongoDB Atlas Connection:**
- **Issue:** Intermittent connection failures due to IP whitelist restrictions
- **Impact:** Database features won't work until IP is whitelisted
- **Solution:** Add current IP to MongoDB Atlas Network Access settings
- **Status:** User configuration required

### **CRUD Operations:**
- **Issue:** No edit/delete for appointments/prescriptions
- **Impact:** Medium - create/read fully functional
- **Status:** Planned for Phase 2

---

## 🚀 Future Enhancements

- [ ] Edit/delete operations for appointments and prescriptions
- [ ] Doctor profile management (specialization, availability)
- [ ] Real-time notifications (WebSocket)
- [ ] File upload for medical records
- [ ] Email appointment reminders
- [ ] Video call integration for telemedicine
- [ ] Payment processing
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Unit and integration tests

---

## 📝 License

This is a **student project prototype** developed for educational purposes.

**⚠️ Important Disclaimer:**  
This platform does not provide real medical advice, diagnosis, or treatment. It is not intended for actual healthcare use. Always consult qualified healthcare professionals for medical concerns.

---

## 👨‍💻 Development

### **Start Development:**
```bash
# Backend (with nodemon hot reload)
cd Backend/server
npm run dev

# Frontend (with Vite hot reload)
cd Frontend/client
npm run dev
```

### **Environment Setup:**
1. MongoDB Atlas cluster with network access configured
2. Google Cloud project with Gemini API enabled
3. JWT secret key generated (use `openssl rand -base64 32`)

---

## 📞 Support

For issues or questions:
1. Check `DEMO_GUIDE.md` for usage instructions
2. Review `IMPLEMENTATION_STATUS.md` for feature details
3. Verify environment variables in `.env`
4. Ensure MongoDB connection and API keys are valid

---

## 🎓 Academic Context

**Project Type:** Full-Stack Web Application  
**Purpose:** Educational/Portfolio Project  
**Technologies:** MERN Stack + AI Integration  
**Complexity:** Advanced (Authentication, Authorization, External APIs, Complex Business Logic)

---

**Built with ❤️ for learning and demonstration purposes**
