import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback (defaults to a friendly editorial error card) */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches React render errors that would otherwise
 * silently unmount the entire tree in React 19 production. Shows the user a
 * recovery UI and logs the stack to console for debugging.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] caught", error, info.componentStack);
    // Surface to a global so AppleScript / debug tools can read it
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lastReactError = {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        time: Date.now(),
      };
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(error, this.reset);
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ops, alguma coisa quebrou
          </p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Não consegui carregar essa tela
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message || "Erro inesperado"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={this.reset}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Tentar de novo
          </button>
          <button
            onClick={() => {
              window.location.href = "/organizai/home";
            }}
            className="rounded-full border border-border bg-background/50 px-5 py-2 text-xs font-semibold transition-colors hover:bg-background"
          >
            Voltar pra home
          </button>
        </div>
        {error.stack && (
          <details className="mt-4 max-w-2xl">
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-card/50 p-3 text-left text-[10px] leading-relaxed text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
