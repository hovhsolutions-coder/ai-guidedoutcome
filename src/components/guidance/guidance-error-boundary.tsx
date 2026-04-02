'use client';

import React from 'react';
import { GuidanceErrorCard } from '@/components/guidance/GuidanceErrorCard';

interface GuidanceErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface GuidanceErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

/**
 * Error boundary for the guidance session flow.
 * Prevents cascading failures if a component crashes during guidance.
 */
export class GuidanceErrorBoundary extends React.Component<
  GuidanceErrorBoundaryProps,
  GuidanceErrorBoundaryState
> {
  constructor(props: GuidanceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GuidanceErrorBoundaryState {
    return { hasError: true, error: error.message || 'Something went wrong in guidance.' };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development, could be sent to observability in production
    // eslint-disable-next-line no-console
    console.error('GuidanceErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="space-y-6 px-6 py-8">
          <GuidanceErrorCard error={this.state.error || 'Guidance session encountered an error.'} />
          <button
            type="button"
            onClick={this.handleReset}
            className="ui-button-secondary"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
