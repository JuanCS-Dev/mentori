import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Global error handler for React components
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Could send to error tracking service here (e.g., Sentry)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Ops! Algo deu errado
              </h1>

              {/* Error Description */}
              <p className="text-slate-500 mb-6">
                Ocorreu um erro inesperado. Não se preocupe, seus dados estão salvos.
                Tente uma das opções abaixo.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  Tentar Novamente
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  <Home size={18} />
                  Voltar ao Início
                </button>
              </div>

              {/* Error Details (collapsible) */}
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-600 flex items-center gap-2">
                    <Bug size={14} />
                    Detalhes técnicos
                  </summary>
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg overflow-auto max-h-40">
                    <p className="text-xs font-mono text-red-600 break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-xs font-mono text-slate-500 mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Support Link */}
            <p className="text-center text-sm text-slate-400 mt-4">
              Problema persistindo?{' '}
              <button
                onClick={this.handleReload}
                className="text-indigo-500 hover:text-indigo-600 font-medium"
              >
                Recarregar página
              </button>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Async Error Boundary for handling async errors in event handlers
 * Use this for wrapping async operations that might fail
 */
export function handleAsyncError(
  operation: () => Promise<void>,
  onError?: (error: Error) => void
): () => Promise<void> {
  return async () => {
    try {
      await operation();
    } catch (error) {
      console.error('Async operation failed:', error);
      onError?.(error as Error);
    }
  };
}
