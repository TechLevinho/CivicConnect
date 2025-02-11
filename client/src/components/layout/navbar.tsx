import { Link } from "wouter";
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

export function Navbar() {
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/auth/me"],
    staleTime: Infinity
  });

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-primary">CivicWatch</span>
              </a>
            </Link>
            <NavigationMenu className="ml-6">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/community-feed">
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Community Feed
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                {user && !user.isOrganization && (
                  <NavigationMenuItem>
                    <Link href="/user/report-issue">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Report Issue
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center">
            {user ? (
              <>
                <Link href={user.isOrganization ? "/organization/dashboard" : "/user/dashboard"}>
                  <Button variant="ghost">Dashboard</Button>
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
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
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
