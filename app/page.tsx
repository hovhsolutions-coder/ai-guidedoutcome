import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,156,255,0.08),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(111,145,205,0.05),_transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a1321_0%,#07111f_44%,#050b14_100%)]" />
      
      {/* Hero section */}
      <div className="relative min-h-screen flex items-center justify-center px-6 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-strong)] bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            <span className="text-white">Business Intelligence</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your data into actionable insights with our advanced AI platform. 
            Make smarter decisions, faster than ever before.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/dossiers" 
              className="ui-button-primary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              Get Started
            </Link>
            <Link 
              href="/api/test" 
              className="ui-button-secondary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              View API Docs
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-20 pt-12 border-t border-[var(--border-subtle)]">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-[var(--text-muted)]">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">99.9%</div>
                <div className="text-sm">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">10M+</div>
                <div className="text-sm">API Calls</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)] mb-1">24/7</div>
                <div className="text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
