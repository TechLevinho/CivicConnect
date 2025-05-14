import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Navbar } from "./components/layout/navbar";
import { Loading } from "./components/ui/loading";
import NotFound from "./pages/not-found";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import UserDashboard from "./pages/user/dashboard";
import ReportIssue from "./pages/user/report-issue";
import IssueDetails from "./pages/user/issue-details";
import OrganizationDashboard from "./pages/organization/ORGdashboard";
import CommunityFeed from "./pages/community-feed";
import LandingPage from "./pages/landing";
import { useToast } from "./components/ui/use-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
  requireUser?: boolean; // Ensure regular users can't access org routes
}

function ProtectedRoute({ children, requireOrg = false, requireUser = false }: ProtectedRouteProps) {
  // Get all auth context values including the explicit isOrganization flag
  const { user, loading, isOrganization, forceRedirectToDashboard } = useAuth();
  const { toast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set a timeout to handle lingering loading states
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);
    
    if (!loading) {
      clearTimeout(timer);
      setIsCheckingAuth(false);
    }
    
    return () => clearTimeout(timer);
  }, [loading]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Protected route auth state:", {
      user: user ? 'authenticated' : 'not authenticated',
      loading,
      isCheckingAuth,
      requireOrg,
      requireUser,
      isOrganization,
      location: window.location.pathname
    });
  }, [user, loading, isCheckingAuth, requireOrg, requireUser, isOrganization]);

  // Explicit check to prevent wrong dashboard access
  useEffect(() => {
    // Only run this check when authentication is complete
    if (!loading && !isCheckingAuth && user) {
      // If requiring org access but user is not an org, redirect to user dashboard
      if (requireOrg && !isOrganization) {
        console.log("User is not an organization but trying to access org route");
        toast({
          title: "Access Denied",
          description: "You don't have organization privileges. Redirecting to user dashboard.",
          variant: "destructive"
        });
        navigate("/user/dashboard");
      }
      
      // If requiring user access but user is an org, redirect to org dashboard
      if (requireUser && isOrganization) {
        console.log("Organization user is trying to access user route");
        toast({
          title: "Wrong Dashboard",
          description: "Redirecting you to the organization dashboard",
          variant: "default"
        });
        navigate("/organization/dashboard");
      }
    }
  }, [user, loading, isCheckingAuth, requireOrg, requireUser, isOrganization, navigate, toast]);

  // Show loading indicator while checking authentication
  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loading />
        <p className="ml-4 text-gray-500">Verifying credentials...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/auth/login" />;
  }

  // Check organization access for organization routes
  if (requireOrg && !isOrganization) {
    console.warn("User does not have organization privileges");
    return <Navigate to="/user/dashboard" />;
  }
  
  // Check user access for user routes (prevent org users from accessing user routes)
  if (requireUser && isOrganization) {
    console.warn("Organization user attempting to access user route");
    return <Navigate to="/organization/dashboard" />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  const { user, loading, isOrganization } = useAuth();
  
  // Log the overall authentication state
  useEffect(() => {
    console.log("App routes auth state:", { 
      user: user ? 'authenticated' : 'not authenticated',
      loading,
      isOrganization,
      path: window.location.pathname
    });
  }, [user, loading, isOrganization]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes - redirect to dashboard if already logged in */}
        <Route 
          path="/auth/login" 
          element={user ? <Navigate to={isOrganization ? "/organization/dashboard" : "/user/dashboard"} /> : <Login />} 
        />
        <Route 
          path="/auth/register" 
          element={user ? <Navigate to={isOrganization ? "/organization/dashboard" : "/user/dashboard"} /> : <Register />} 
        />
        
        {/* Protected Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute requireUser>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/report-issue"
          element={
            <ProtectedRoute requireUser>
              <ReportIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/issues/:id"
          element={
            <ProtectedRoute requireUser>
              <IssueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/dashboard"
          element={
            <ProtectedRoute requireOrg>
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Public Routes */}
        <Route path="/community-feed" element={<CommunityFeed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
} 