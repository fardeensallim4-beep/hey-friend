import { Loader2 } from "lucide-react";
import { MainLayout } from "./components/layout/MainLayout";
import { Toaster } from "./components/ui/sonner";
import { I18nProvider } from "./contexts/I18nContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerProfile } from "./hooks/useQueries";
import { AuthPage } from "./pages/AuthPage";
import { RegistrationPage } from "./pages/RegistrationPage";

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const {
    data: profile,
    isLoading: loadingProfile,
    isFetching: fetchingProfile,
  } = useCallerProfile();

  // Global loading state: show spinner while identity or initial profile load is in progress
  const showLoading =
    isInitializing ||
    (isLoggedIn &&
      (loadingProfile || (fetchingProfile && profile === undefined)));

  if (showLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <img
              src="/assets/generated/hey-friend-logo-transparent.dim_120x120.png"
              alt="HEY FRIEND"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading HEY FRIEND...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  if (!profile) {
    return <RegistrationPage />;
  }

  return <MainLayout profile={profile} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppContent />
        <Toaster richColors position="top-right" />
      </I18nProvider>
    </ThemeProvider>
  );
}
