# Quick Start Guide

Get FamilyHealthCare running in 5 minutes!

## TL;DR - Ultra Fast Setup

### Backend (Terminal 1)
```bash
cd Family_Health_Care_WebApp/Backend/server
npm install
npm run dev
```

### Frontend (Terminal 2)
```bash
cd Family_Health_Care_WebApp/Frontend/client
npm install
npm run dev
```

**Done!** Access at http://localhost:5174

## Login with Demo Account

After backend starts, it's pre-configured with MongoDB Atlas:

**Patient Account:**
- Email: `kushal04@gmail.com`
- Password: `Pass1234`

or create your own account by registering!

## What to Try

1. **Register**: Create new account with location
2. **Find Doctors**: Search by city
3. **Book Appointment**: Select online/offline
4. **Upload File**: Try uploading an image or PDF
5. **Check OCR**: Text extracted automatically
6. **Get AI Advice**: Ask for prescription analysis
7. **Dark Mode**: Toggle top-right button

## Project Structure

```
Major_Project/
├── Family_Health_Care_WebApp/
│   ├── Backend/
│   │   └── server/
│   │       ├── models/          # MongoDB schemas
│   │       ├── routes/          # API endpoints
│   │       ├── middleware/      # Auth middleware
│   │       ├── utils/           # OCR, meeting links
│   │       ├── seed/            # Demo data
│   │       ├── uploads/         # Uploaded files
│   │       ├── index.js         # Server entry
│   │       └── package.json
│   │
│   └── Frontend/
│       └── client/
│           ├── src/
│           │   ├── pages/       # Page components
│           │   ├── components/  # UI components
│           │   ├── context/     # Auth, theme
│           │   ├── lib/         # Utilities
│           │   ├── App.jsx
│           │   └── main.jsx
│           └── package.json
│
├── README.md                     # Main documentation
├── DEPLOYMENT_GUIDE.md          # Railway deployment
├── IMPLEMENTATION_STATUS.md     # Feature checklist
├── TEST_RESULTS.md              # Testing docs
├── Dockerfile                   # Docker config
├── docker-compose.yml           # Local Docker setup
└── .gitignore
```

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/doctors` | GET | List all doctors |
| `/api/doctors/search` | GET | Find by location |
| `/api/appointments` | POST | Book appointment |
| `/api/uploads` | POST | Upload file |
| `/api/ai/prescription-advice` | POST | Get AI analysis |

See full API docs in [README.md](./README.md)

## Environment Setup

### Backend .env
```
MONGODB_URI=mongodb+srv://kushal22csu099_db_user:39iI5hWlaLaMFoxO@cluster0.zdxaqlm.mongodb.net/family_healthcare
JWT_SECRET=G4g8sdf8A_sd9!2ksdkus
PORT=5000
GEMINI_API_KEY=AIzaSyD...
```

### Frontend .env
```
VITE_API_BASE_URL=http://localhost:5000
```

## Features to Test

✅ User registration with location
✅ Login & authentication
✅ Doctor search by city/state
✅ Book online/offline appointments
✅ Upload medical files (images, PDFs)
✅ OCR text extraction
✅ AI prescription advice
✅ Dark/light theme
✅ Family member management
✅ Appointment history

## Troubleshooting

### Backend won't start
```
// Kill process on port 5000
taskkill /F /IM node.exe  # Windows

// Then retry
npm run dev
```

### Frontend can't connect to backend
- Check backend is running on 5000
- Verify VITE_API_BASE_URL in .env
- Clear browser cache (Ctrl+Shift+Del)

### File upload fails
- Check `/uploads` folder exists
- Ensure file is <50MB
- Try image file first (JPG/PNG)

### OCR not working
- Large files may timeout
- OCR is optional - upload still succeeds
- Check backend logs for errors

## Next Steps

1. **Explore Features**: Try all functionality
2. **Read Docs**: Check DEPLOYMENT_GUIDE.md for hosting
3. **Test on Mobile**: Use DevTools responsive mode
4. **Deploy**: Follow DEPLOYMENT_GUIDE.md for Railway
5. **Customize**: Modify colors, text, features

## Database

Uses MongoDB Atlas (cloud hosted):
- Cluster: `cluster0.zdxaqlm.mongodb.net`
- Database: `family_healthcare`
- Collections: Users, Appointments, Prescriptions, Uploads, etc.

## Need Help?

1. Check README.md for detailed docs
2. Review error messages in browser console (F12)
3. Check backend logs in terminal
4. See IMPLEMENTATION_STATUS.md for feature details

---

**Enjoy using FamilyHealthCare!** 💚
