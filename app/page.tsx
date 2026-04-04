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
          <div className="mb-5 inline-flex">
            <span className="ui-chip ui-chip-accent">Dossier workspace</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-white">Move the next</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-strong)] bg-clip-text text-transparent">
              dossier forward
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed">
            Capture the situation, review a focused draft, and open the workspace when you are ready to act.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dossiers/new"
              className="ui-button-primary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              Start a dossier
            </Link>
            <Link
              href="/dossiers"
              className="ui-button-secondary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              Open queue
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm text-[var(--text-muted)]">
            <span className="ui-surface-secondary px-4 py-2">Clear intake</span>
            <span className="ui-surface-secondary px-4 py-2">Fast preview</span>
            <span className="ui-surface-secondary px-4 py-2">Priority queue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
