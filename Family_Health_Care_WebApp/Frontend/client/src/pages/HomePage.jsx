import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const ctaTo = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="bg-bgLight">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-primary">
              Your Family's Health, Simplified
            </h1>
            <p className="mt-4 text-primary/70 text-lg leading-relaxed">
              Manage your family health records, book online or offline appointments, upload medical reports, and get quick AI-powered symptom checks — all in one secure platform.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to={ctaTo}
                className="inline-flex items-center rounded-md bg-accent text-white font-semibold px-5 py-3 shadow-sm hover:opacity-95"
              >
                Get Started
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center rounded-md border border-accent text-accent font-semibold px-5 py-3 hover:bg-accentLight"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative rounded-2xl border border-accent/20 bg-white p-6 shadow-sm">
              <div className="absolute -top-3 -left-3 h-16 w-16 rounded-xl bg-accentLight border border-accent/20" />
              <div className="absolute -bottom-3 -right-3 h-20 w-20 rounded-xl bg-accentLight border border-accent/20" />
              <div className="relative">
                <div className="h-56 rounded-xl bg-accentLight border border-accent/20 grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-20 w-20 text-accent">
                    <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-primary">Our Services</h2>
          <p className="mt-2 text-primary/70">Everything you need for modern family healthcare</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ServiceCard
            icon={(cls) => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25S13.24 11.25 12 11.25 9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z"/>
              </svg>
            )}
            title="Online & Offline Visits"
            desc="Book secure video appointments or schedule in-person visits with licensed healthcare providers."
          />
          <ServiceCard
            icon={(cls) => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            )}
            title="Family Health Profiles"
            desc="Manage health records for every family member in one organized, secure dashboard."
          />
          <ServiceCard
            icon={(cls) => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            )}
            title="AI Symptom Checker"
            desc="Get instant AI-powered triage guidance powered by Google Gemini to help decide next steps."
          />
          <ServiceCard
            icon={(cls) => (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cls}>
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM7 11h5v5H7z"/>
              </svg>
            )}
            title="Appointment & Prescription History"
            desc="Track all appointments, prescriptions, and follow-ups in one convenient timeline."
          />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-accent/20 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Why Choose FamilyCare?</h2>
            <p className="mt-2 text-primary/70">Modern healthcare built on cutting-edge technology</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <BenefitItem
              title="Family-Centric Dashboard"
              desc="Purpose-built for families to manage multiple members' health records with ease and clarity."
            />
            <BenefitItem
              title="Secure JWT Authentication"
              desc="Bank-level security with JWT tokens and MongoDB Atlas cloud storage for your sensitive health data."
            />
            <BenefitItem
              title="AI-Assisted Triage"
              desc="Powered by Google Gemini AI for intelligent symptom analysis and health guidance."
            />
            <BenefitItem
              title="Modern MERN Stack"
              desc="Built with MongoDB, Express, React, and Node.js — the gold standard for scalable web applications."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-primary">What Our Users Say</h2>
          <p className="mt-2 text-primary/70">Real feedback from families using FamilyCare</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <TestimonialCard
            quote="FamilyCare has made managing my kids' appointments so much easier. I can book, track, and get reminders all in one place!"
            name="Sarah Johnson"
            role="Working Mom of 3"
          />
          <TestimonialCard
            quote="The AI symptom checker gave me peace of mind when my daughter had a fever. It helped me decide whether to wait or see a doctor immediately."
            name="Michael Chen"
            role="Parent"
          />
          <TestimonialCard
            quote="As a grandparent helping with family health, this dashboard keeps everything organized. I can see my grandchildren's appointments and prescriptions easily."
            name="Margaret Williams"
            role="Grandmother & Family Admin"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 pb-20">
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accentLight p-10 text-center">
          <h2 className="text-3xl font-bold text-primary">Ready to Get Started?</h2>
          <p className="mt-3 text-primary/70 text-lg">Join families who trust FamilyCare for their health management</p>
          <div className="mt-6">
            <Link
              to={ctaTo}
              className="inline-flex items-center rounded-md bg-accent text-white font-semibold px-6 py-3 shadow-sm hover:opacity-95"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign Up Free'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon, title, desc }) {
  return (
    <div className="rounded-xl border border-accent/20 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-accentLight border border-accent/20 grid place-items-center text-accent mb-3">
        {icon('h-6 w-6')}
      </div>
      <h4 className="text-lg font-semibold text-primary">{title}</h4>
      <p className="mt-2 text-primary/70 text-sm">{desc}</p>
    </div>
  );
}

function BenefitItem({ title, desc }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1">
        <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-primary">{title}</h4>
        <p className="mt-1 text-primary/70 text-sm">{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role }) {
  return (
    <div className="rounded-xl border border-accent/20 bg-white p-6 shadow-sm">
      <svg className="h-8 w-8 text-accent/30" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
      </svg>
      <p className="mt-3 text-primary/80 italic text-sm leading-relaxed">"{quote}"</p>
      <div className="mt-4 border-t border-accent/10 pt-4">
        <p className="font-semibold text-primary text-sm">{name}</p>
        <p className="text-xs text-primary/60">{role}</p>
      </div>
    </div>
  );
}
