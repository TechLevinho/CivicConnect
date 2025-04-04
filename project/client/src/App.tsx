import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/navbar";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import UserDashboard from "@/pages/user/dashboard";
import ReportIssue from "@/pages/user/report-issue";
import OrganizationDashboard from "@/pages/organization/dashboard";
import CommunityFeed from "@/pages/community-feed";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Switch>
        <Route path="/" component={CommunityFeed} />
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        <ProtectedRoute path="/user/dashboard" component={UserDashboard} />
        <ProtectedRoute path="/user/report-issue" component={ReportIssue} />
        <ProtectedRoute 
          path="/organization/dashboard" 
          component={OrganizationDashboard} 
          requireOrg
        />
        <Route path="/community-feed" component={CommunityFeed} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;