import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-accent/20 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-xl font-bold text-primary mb-2">FamilyCare</h3>
            <p className="text-sm text-primary/70 leading-relaxed">
              Modern healthcare platform for managing family health records, doctor appointments, report uploads, and AI-powered symptom checking.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-primary/70 hover:text-accent">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-primary/70 hover:text-accent">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-primary/70 hover:text-accent">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-primary/70 hover:text-accent">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Legal</h4>
            <div className="bg-accentLight/30 border border-accent/20 rounded-lg p-3">
              <p className="text-xs text-primary/70 leading-relaxed">
                <strong className="text-primary">⚠️ Disclaimer:</strong> This is a student project prototype developed for educational purposes. 
                This platform does not provide real medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-accent/10 text-center">
          <p className="text-xs text-primary/60">
            © {currentYear} FamilyCare. All rights reserved. | Built with React, Node.js, MongoDB & Google Gemini AI
          </p>
        </div>
      </div>
    </footer>
  );
}
