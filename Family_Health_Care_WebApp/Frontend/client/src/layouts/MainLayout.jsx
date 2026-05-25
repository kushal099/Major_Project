import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

// Layout with fixed navbar and themed background
export default function MainLayout() {
  return (
    <div className="min-h-screen bg-bgLight text-primary flex flex-col">
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-7xl mx-auto w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
