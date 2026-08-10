import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render tree:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-stone-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-black text-slate-900">
              Une erreur est survenue lors du chargement
            </h1>
            <p className="text-sm text-slate-600">
              {this.state.error?.message || 'L\'application a rencontré un problème inattendu.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-sky-600 text-white font-medium rounded-lg text-sm hover:bg-sky-700 transition"
              >
                Recharger la page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-stone-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-stone-300 transition"
              >
                Réinitialiser les données
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
