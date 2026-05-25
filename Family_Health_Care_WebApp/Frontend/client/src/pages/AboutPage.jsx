export default function AboutPage() {
  return (
    <div className="bg-bgLight">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">About FamilyCare</h1>
          <p className="mt-2 text-primary/70 max-w-3xl">
            FamilyCare is a modern, privacy‑minded platform that helps families manage health records, appointments,
            and quick triage with AI—built on a reliable, scalable web stack.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Overview text */}
          <div className="rounded-xl border border-accent/20 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-primary">Architecture Overview</h2>
            <p className="mt-3 text-primary/80 leading-relaxed">
              Our system follows a clean separation of concerns with an API‑first backend and a responsive
              frontend. Authentication uses secure JSON Web Tokens (JWT) and the database is hosted on
              MongoDB Atlas. The AI Symptom Checker integrates with Google&apos;s Gemini API for fast,
              structured triage suggestions.
            </p>
            <p className="mt-3 text-primary/80 leading-relaxed">
              This architecture keeps the experience snappy on mobile and desktop, while ensuring security,
              maintainability, and room to grow.
            </p>
          </div>

          {/* Right: Bullet list */}
          <div className="rounded-xl border border-accent/20 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-primary">Key Components</h3>
            <ul className="mt-3 space-y-3 text-primary/80">
              <li className="flex items-start gap-3">
                <Badge>Frontend</Badge>
                <div>
                  <p className="font-medium text-primary">React + Vite + Tailwind</p>
                    <p className="text-sm">Responsive UI with our medical palette (primary, accent, accentLight, bgLight).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge>Backend</Badge>
                <div>
                  <p className="font-medium text-primary">Node.js + Express (API‑first)</p>
                  <p className="text-sm">Routes for auth, appointments, and AI symptom checks.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge>Auth</Badge>
                <div>
                  <p className="font-medium text-primary">JWT Authentication</p>
                  <p className="text-sm">Secure login and protected routes using Bearer tokens.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge>Database</Badge>
                <div>
                  <p className="font-medium text-primary">MongoDB Atlas</p>
                  <p className="text-sm">Cloud‑hosted database with Mongoose models (Users, Appointments).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Badge>AI</Badge>
                <div>
                  <p className="font-medium text-primary">Gemini API</p>
                  <p className="text-sm">AI Symptom Checker powered by Google Gemini for structured outputs.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md bg-accentLight text-accent text-xs font-semibold px-2 border border-accent/20">
      {children}
    </span>
  );
}
