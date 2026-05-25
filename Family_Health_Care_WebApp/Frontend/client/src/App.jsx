import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DoctorDashboardPage from './pages/DoctorDashboardPage.jsx';
import FamilyAdminPage from './pages/FamilyAdminPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// App sets up the route tree under MainLayout
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="family"
          element={
            <ProtectedRoute>
              <FamilyAdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor-dashboard"
          element={
            <ProtectedRoute>
              <DoctorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
    </Routes>
  );
}
