import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import type { User } from "@shared/schema";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requireOrg?: boolean;
}

export function ProtectedRoute({ path, component: Component, requireOrg = false }: ProtectedRouteProps) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
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
