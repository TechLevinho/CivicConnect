import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Get the Firebase auth token
  useEffect(() => {
    const getToken = async () => {
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(true);
          setAuthToken(token);
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      }
    };
    
    getToken();
  }, [authUser]);
  
  // Only fetch user data if we have authentication
  const { data: userData, isLoading } = useQuery({ 
    queryKey: ["/api/auth/me", authToken],
    enabled: !!authToken,
    staleTime: Infinity,
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
    }
  });

  // Determine if user is authenticated based on both auth context and API data
  const isAuthenticated = !!authUser && !!authToken;
  const userInfo = userData || null;

  const handleLogout = async () => {
    try {
      // First, call the server-side logout endpoint if token exists
      if (authToken) {
        await fetch("/api/auth/logout", { 
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
      }
      
      // Then use the AuthContext logout function to sign out of Firebase
      await logout();
      
      // Navigate using React Router instead of page reload
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // If logout fails, still try to navigate to login
      navigate("/auth/login");
    }
  };

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
                {isAuthenticated && userInfo && !userInfo.isOrganization && (
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
            {isAuthenticated && userInfo ? (
              <>
                <Link to={userInfo.isOrganization ? "/organization/dashboard" : "/user/dashboard"}>
                  <Button variant="ghost">
                    {userInfo.isOrganization ? "Organization Dashboard" : "User Dashboard"}
                  </Button>
                </Link>
                <Button 
                  variant="ghost"
                  onClick={handleLogout}
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
                  <Button 
                    variant="default" 
                    className="ml-4 font-semibold shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1 button-gradient text-white"
                  >
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}