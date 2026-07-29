import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset?: () => void;
  key?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// React class component extension for strict TS configuration
const ComponentClass: any = React.Component;

export class ErrorBoundary extends ComponentClass {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component module:', error, errorInfo);
  }

  handleReset = () => {
    (this as any).setState({ hasError: false, error: undefined });
    if ((this as any).props?.onReset) {
      (this as any).props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if ((this as any).state?.hasError) {
      return (
        <div className="p-6 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Ops! Algo deu errado ao carregar este módulo</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Detectamos uma falha temporária ao renderizar o conteúdo. Clique no botão abaixo para tentar recarregar.
          </p>
          {(this as any).state?.error && (
            <p className="text-[10px] font-mono text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-200 break-all max-h-20 overflow-y-auto">
              {String((this as any).state.error)}
            </p>
          )}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props?.children;
  }
}
