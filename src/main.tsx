import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!, {
  onUncaughtError: (error, info) => {
    // React 19 silences these by default in production — surface them.
    console.error("[react] uncaught", error, info.componentStack);
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__lastReactError = {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
        componentStack: info.componentStack,
        type: "uncaught",
        time: Date.now(),
      };
    }
  },
  onCaughtError: (error, info) => {
    console.error("[react] caught (boundary)", error, info.componentStack);
  },
}).render(
  <StrictMode>
    <BrowserRouter basename="/organizai">
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <TooltipProvider>
              <App />
              <Toaster
                richColors
                position="top-center"
                mobileOffset={{ top: "calc(3.5rem + env(safe-area-inset-top))" }}
                toastOptions={{
                  classNames: {
                    toast: "!rounded-2xl !border !border-border !shadow-2xl !backdrop-blur-md",
                  },
                }}
              />
            </TooltipProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
