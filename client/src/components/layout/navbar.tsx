import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useEffect } from "react";

export function Navbar() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    staleTime: Infinity
  });

  // Refetch user data when component mounts to ensure we have the latest data
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <span className="text-xl font-bold text-primary cursor-pointer">CivicWatch</span>
              </Link>
            </div>
            <NavigationMenu className="ml-6">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/community-feed">
                      <span className={navigationMenuTriggerStyle()}>
                        Community Feed
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {user && !user.isOrganization && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/user/report-issue">
                        <span className={navigationMenuTriggerStyle()}>
                          Report Issue
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center">
            {user ? (
              <>
                <Link to={user.isOrganization ? "/organization/dashboard" : "/user/dashboard"}>
                  <Button variant="ghost">
                    {user.isOrganization ? "Organization Dashboard" : "User Dashboard"}
                  </Button>
                </Link>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/auth/login";
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="default" className="ml-4">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}