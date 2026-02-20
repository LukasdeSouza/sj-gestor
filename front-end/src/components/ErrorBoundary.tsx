import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
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

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 bg-background text-foreground">
          <div className="bg-destructive/10 p-6 rounded-full">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Ops! Algo deu errado.</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Encontramos um erro inesperado ao tentar exibir esta página.
            </p>
          </div>
          
          {this.state.error && (
            <div className="w-full max-w-lg p-4 bg-muted/50 rounded-lg border text-left overflow-auto max-h-48 text-xs font-mono text-muted-foreground">
              <p className="font-semibold mb-1 text-foreground">Detalhes do erro:</p>
              {this.state.error.toString()}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.reload()} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.href = "/dashboard"} variant="outline" size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Ir para o Início
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
