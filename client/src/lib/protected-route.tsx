import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requireOrg?: boolean;
}

export function ProtectedRoute({ path, component: Component, requireOrg = false }: ProtectedRouteProps) {
  const { user: authUser } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Get the Firebase auth token when the component mounts
  useEffect(() => {
    const getToken = async () => {
      if (authUser && auth.currentUser) {
        try {
          // Get token from Firebase Auth using the currentUser object
          const token = await auth.currentUser.getIdToken(true);
          setAuthToken(token);
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      }
    };
    
    getToken();
  }, [authUser]);
  
  // Use the token in the API request
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me", authToken],
    enabled: !!authToken, // Only run the query if we have a token
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      return response.json();
    },
  });

  if (isLoading || !authToken) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth/login" />
      </Route>
    );
  }

  if (requireOrg && !user.isOrganization) {
    return (
      <Route path={path}>
        <Redirect to="/user/dashboard" />
      </Route>
    );
  }

  if (!requireOrg && user.isOrganization) {
    return (
      <Route path={path}>
        <Redirect to="/organization/dashboard" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
