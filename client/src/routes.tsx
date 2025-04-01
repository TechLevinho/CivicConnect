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
import OrganizationDashboard from "./pages/organization/dashboard";
import CommunityFeed from "./pages/community-feed";
import LandingPage from "./pages/landing";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

function ProtectedRoute({ children, requireOrg = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  if (requireOrg && !user.isOrganization) {
    return <Navigate to="/user/dashboard" />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/report-issue"
          element={
            <ProtectedRoute>
              <ReportIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/issues/:id"
          element={
            <ProtectedRoute>
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
        <Route path="/community-feed" element={<CommunityFeed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
} 