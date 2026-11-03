import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import Home from "./pages/Home";
// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBanks from "./pages/admin/AdminBanks";
// import AdminMLInsights from "./pages/admin/AdminMLInsights";
// User pages
import UserRegister from "./pages/user/UserRegister";
import UserLogin from "./pages/user/UserLogin";
import UserDashboard from "./pages/user/UserDashboard";
import UserProfile from "./pages/user/UserProfile";
import UserApplications from "./pages/user/UserApplications";
import UserApplicationHistory from "./pages/user/UserApplicationHistory";
import AdminReports from "./pages/admin/AdminReports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin/login"} component={AdminLogin} />
      <Route path={"/admin/dashboard"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/applications"} component={AdminApplications} />
      <Route path={"/admin/payments"} component={AdminPayments} />
      <Route path={"/admin/settings"} component={AdminSettings} />
      <Route path={"/admin/banks"} component={AdminBanks} />
      <Route path={"/admin/reports"} component={AdminReports} />
      {/* <Route path={"/admin/ml-insights"} component={AdminMLInsights} /> */}
      <Route path={"/user/register"} component={UserRegister} />
      <Route path={"/user/login"} component={UserLogin} />
      <Route path={"/user/dashboard"} component={UserDashboard} />
      <Route path={"/user/profile"} component={UserProfile} />
      <Route path={"/user/applications"} component={UserApplications} />
      <Route path={"/user/application-history"} component={UserApplicationHistory} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <UserAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </UserAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
