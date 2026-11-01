import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="card p-8 max-w-md text-center">
            <div className="w-14 h-14 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-error-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
            <p className="text-sm text-neutral-500 mt-2 mb-6">
              The page encountered an unexpected error. Try refreshing, or go back to the homepage.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={this.handleReset} className="btn-secondary">
                <RefreshCw size={16} /> Try Again
              </button>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
