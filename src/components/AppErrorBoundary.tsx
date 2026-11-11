import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A screen failed to render:", error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-[50dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
          <h1 className="text-2xl font-bold">This screen couldn't load</h1>
          <p className="text-subtle">Return to the game menu and try again.</p>
          <Link
            to="/games"
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            Back to games
          </Link>
        </main>
      );
    }

    return this.props.children;
  }
}
