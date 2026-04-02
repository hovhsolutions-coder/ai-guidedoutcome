'use client';

import React from 'react';
import Link from 'next/link';

interface DossierErrorBoundaryProps {
  children: React.ReactNode;
  dossierId: string;
}

interface DossierErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

/**
 * Error boundary for the dossier detail experience.
 * Prevents cascading failures if a component crashes during dossier viewing.
 */
export class DossierErrorBoundary extends React.Component<
  DossierErrorBoundaryProps,
  DossierErrorBoundaryState
> {
  constructor(props: DossierErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DossierErrorBoundaryState {
    return { hasError: true, error: error.message || 'Something went wrong loading this dossier.' };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('DossierErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-8">
          <div>
            <Link
              href="/dossiers"
              className="ui-button-ghost mb-4 inline-flex min-h-0 items-center gap-2 px-0 py-0 text-[var(--accent-primary-strong)] hover:bg-transparent"
            >
              Back to Dossiers
            </Link>
          </div>
          <div className="ui-surface-primary py-12 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--warning-strong)]">
              Dossier view encountered a problem
            </p>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {this.state.error || 'This dossier view could not be displayed properly.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="ui-button-primary"
              >
                Try again
              </button>
              <Link href="/dossiers" className="ui-button-secondary inline-flex">
                Return to Dossiers
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
