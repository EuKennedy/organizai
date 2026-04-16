import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/organizai">
      <ThemeProvider>
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
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
