import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { type Issue as BaseIssue } from "../../types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Trophy,
  Bell,
  MessageSquare,
  Search,
  Filter,
  BarChart3,
  FileText,
  PlusCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "../../components/ui/use-toast";
import { Loading, LoadingSpinner } from "../../components/ui/loading";
import { Footer } from '../../components/footer';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth } from "firebase/auth";
import { useIssueStore, type IssueStore } from "../../lib/issueStore";
import "../../styles/main.css";
import "../../styles/issues.css";

type IssueStatus = "open" | "in_progress" | "resolved";

// Extended Issue interface with UI-specific properties
interface Issue extends Omit<BaseIssue, 'severity'> {
  severity: string;
  priority?: string;
  organizationName?: string | null;
  updatedAt?: Date | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Fallback data is now retrieved from the Zustand store
// The hardcoded DEMO_ISSUES array is removed

/**
 * Format location data that might be a GeoPoint, string, or other format
 */
const formatLocation = (location: any): string => {
  // Handle Firebase GeoPoint objects
  if (location && typeof location === 'object' && '_latitude' in location && '_longitude' in location) {
    return `Lat: ${location._latitude.toFixed(4)}, Lng: ${location._longitude.toFixed(4)}`;
  }
  
  // Handle GeoPoint-like objects
  if (location && typeof location === 'object' && 'latitude' in location && 'longitude' in location) {
    return `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`;
  }
  
  // Handle string locations
  if (location && typeof location === 'string') {
    return location;
  }
  
  // Default fallback
  return 'Location not specified';
};

/**
 * Transforms the fetched issues data to handle special data types like GeoPoint
 */
const transformIssues = (issues: any[]): Issue[] => {
  if (!Array.isArray(issues)) {
    console.warn("Expected issues to be an array but got:", typeof issues);
    return [];
  }
  
  return issues.map(issue => {
    // Create a new object to avoid mutating the original
    const transformed = { ...issue };
    
    // Handle date objects/strings
    if (issue.createdAt) {
      try {
        // If it's a Firestore Timestamp, it might have seconds and nanoseconds
        if (typeof issue.createdAt === 'object' && 'seconds' in issue.createdAt) {
          transformed.createdAt = new Date(issue.createdAt.seconds * 1000);
        } 
        // If it's already a date
        else if (issue.createdAt instanceof Date) {
          transformed.createdAt = issue.createdAt;
        }
        // If it's a string date
        else if (typeof issue.createdAt === 'string') {
          transformed.createdAt = new Date(issue.createdAt);
        }
      } catch (e) {
        console.warn("Error parsing date:", e);
        transformed.createdAt = null;
      }
    }
    
    // Handle location (store both the original location for APIs and a formatted string)
    if (issue.location) {
      transformed.locationData = issue.location; // Store the original for API calls
      
      // Extract latitude/longitude for map display if it's a GeoPoint
      if (typeof issue.location === 'object' && '_latitude' in issue.location && '_longitude' in issue.location) {
        transformed.latitude = issue.location._latitude;
        transformed.longitude = issue.location._longitude;
        transformed.location = formatLocation(issue.location);
      } else if (typeof issue.location === 'object' && 'latitude' in issue.location && 'longitude' in issue.location) {
        transformed.latitude = issue.location.latitude;
        transformed.longitude = issue.location.longitude;
        transformed.location = formatLocation(issue.location);
      }
    }
    
    return transformed as Issue;
  });
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(true);
  const [useLocalData, setUseLocalData] = useState(true);
  const { user, refreshUserData } = useAuth();
  const auth = getAuth();
  const [token, setToken] = useState<string | null>(null);
  const hasAttemptedFetch = useRef(false);
  const tokenRefreshAttempted = useRef(false);
  
  // Get demo issues from the store
  const demoIssues = useIssueStore((state: IssueStore) => state.demoIssues);

  // Effect to handle authentication token
  useEffect(() => {
    const getToken = async () => {
      try {
        if (auth.currentUser) {
          console.log("Getting token from auth.currentUser");
          const token = await auth.currentUser.getIdToken(true);
          console.log("Token obtained successfully");
          setToken(token);
          return token;
        }
        return null;
      } catch (error) {
        console.error("Error getting auth token:", error);
        return null;
      }
    };
    
    getToken();
    
    // Set up auth state listener to keep token updated
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log("Auth state changed in dashboard:", authUser ? "User signed in" : "User signed out");
      if (authUser) {
        getToken();
      } else {
        setToken(null);
        // Only switch to local data if we've already attempted a fetch
        if (hasAttemptedFetch.current) {
          setUseLocalData(true);
        }
      }
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Refresh user data if we have a user but no token
  useEffect(() => {
    if (user && !token && !tokenRefreshAttempted.current) {
      console.log("Have user but no token, refreshing user data");
      tokenRefreshAttempted.current = true;
      refreshUserData();
    }
  }, [user, token, refreshUserData]);

  // Set a timeout to hide loading indicator after 5 seconds maximum
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingIndicator(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Set up query client subscription for live updates to stats
  useEffect(() => {
    // Track when a new issue is added by another component
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Get the latest issues data
      const issuesData = queryClient.getQueryData<any>(["/api/issues", token]);
      
      if (issuesData) {
        console.log("Issue data updated in cache:", issuesData);
        // We don't need to do anything else since React Query will
        // automatically update our components that use this data
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, token]);

  const fetchIssues = async (): Promise<Issue[]> => {
    hasAttemptedFetch.current = true;
    
    if (!user) {
      console.error("Fetch issues called with no user");
      return demoIssues;
    }
    
    try {
      console.log("Fetching issues - starting authentication process");
      // Get the user's auth token
      const currentToken = token || await auth.currentUser?.getIdToken(true);
      
      if (!currentToken) {
        console.error("No authentication token available");
        return demoIssues;
      }
      
      console.log("Token obtained, making API request");
      
      const response = await fetch("/api/issues", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${currentToken}`,
          "Content-Type": "application/json"
        }
      });
      
      console.log("API response received:", {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        
        console.error("Error fetching issues:", response.status, errorData);
        
        // For 401/403 errors, we might need to refresh the token
        if (response.status === 401 || response.status === 403) {
          // Only try to refresh token if we have a current user
          if (auth.currentUser) {
            console.log("Auth error - refreshing token");
            const newToken = await auth.currentUser.getIdToken(true);
            setToken(newToken);
            // Don't retry immediately - let the useEffect trigger it
          }
        }
        
        return demoIssues;
      }
      
      const data = await response.json();
      
      // Handle the new response format
      if (data && data.issues && Array.isArray(data.issues)) {
        console.log(`Successfully fetched ${data.count || data.issues.length} issues`);
        return transformIssues(data.issues);
      }
      
      // Handle the old response format (directly array of issues)
      if (Array.isArray(data)) {
        console.log(`Successfully fetched ${data.length} issues`);
        return transformIssues(data);
      }
      
      // Fallback to empty array for unexpected format
      console.warn("Unexpected response format:", data);
      return [];
    } catch (error) {
      console.error("Error in fetchIssues:", error);
      // Return demo data from the store instead of hardcoded array
      return demoIssues;
    }
  };

  const { data: issues = [], isLoading, error } = useQuery<Issue[]>({
    queryKey: ["/api/issues", token],
    queryFn: useLocalData ? () => Promise.resolve(demoIssues) : fetchIssues,
    staleTime: 60000, // Cache data for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
    enabled: !!user || !!auth.currentUser, // Run query if we have either user state or current Firebase user
    refetchInterval: token ? false : 5000, // If no token, retry every 5 seconds
    onSettled: (data: Issue[] | undefined, error: Error | null) => {
      if (error) {
        console.log("Query settled with error:", error);
        setShowLoadingIndicator(false);
        setUseLocalData(true);
        // Update the query data with demo issues from the store
        queryClient.setQueryData(["/api/issues", token], demoIssues);
      } else {
        console.log("Query settled successfully with data");
      }
    }
  } as UseQueryOptions<Issue[]>);

  useEffect(() => {
    if (error) {
      console.error("Query error:", error);
      setShowLoadingIndicator(false);
      toast({
        title: "Error",
        description: "Failed to fetch issues from the server. Showing demo data instead.",
        variant: "destructive",
      });
      
      // Switch to local data if we have an error
      setUseLocalData(true);
      
      // Update the query data with demo issues from the store
      queryClient.setQueryData(["/api/issues", token], demoIssues);
    }
  }, [error, toast, queryClient, token, demoIssues]);

  const stats = [
    {
      label: "Total Issues",
      value: issues?.length || 0,
      icon: <BarChart3 className="h-8 w-8" />,
      color: "text-blue-500"
    },
    {
      label: "Resolved",
      value: (issues || []).filter((i: Issue) => i.status === "resolved").length,
      icon: <CheckCircle2 className="h-8 w-8" />,
      color: "text-green-500"
    },
    {
      label: "In Progress",
      value: (issues || []).filter((i: Issue) => i.status === "in_progress").length,
      icon: <Clock className="h-8 w-8" />,
      color: "text-yellow-500"
    },
    {
      label: "Points Earned",
      value: "1,234",
      icon: <Trophy className="h-8 w-8" />,
      color: "text-purple-500"
    }
  ];

  const filteredIssues = (issues || []).filter((issue: Issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Display loading indicator initially
  if (isLoading && showLoadingIndicator && !useLocalData && !filteredIssues.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 mt-4">Loading your dashboard...</p>
      </div>
    );
  }

  // If user is not authenticated and we're not using local data, show login message
  if (!user && !auth.currentUser && !useLocalData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to be logged in to view your dashboard.</p>
            <div className="flex space-x-4">
              <Button onClick={() => navigate("/auth/login")}>
                Log In
              </Button>
              <Button variant="outline" onClick={() => navigate("/auth/register")}>
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="container mx-auto py-8 px-4 flex-grow animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening in your community</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Total Issues</h3>
                <p className="stats-value">{issues?.length || 0}</p>
              </div>
              <div className="text-blue-500 stats-icon">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Resolved</h3>
                <p className="stats-value">
                  {(issues || []).filter((i: Issue) => i.status === "resolved").length}
                </p>
              </div>
              <div className="text-green-500 stats-icon">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">In Progress</h3>
                <p className="stats-value">
                  {(issues || []).filter((i: Issue) => i.status === "in_progress").length}
                </p>
              </div>
              <div className="text-yellow-500 stats-icon">
                <Clock className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Points Earned</h3>
                <p className="stats-value">1,234</p>
              </div>
              <div className="text-purple-500 stats-icon">
                <Trophy className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 action-button"
            onClick={() => navigate("/user/report-issue")}
          >
            <PlusCircle className="h-6 w-6 action-button-icon" />
            <span className="action-button-text">Report Issue</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 action-button"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "This feature is not yet available.",
              });
            }}
          >
            <Bell className="h-6 w-6 action-button-icon" />
            <span className="action-button-text">Notifications</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 action-button"
            onClick={() => navigate("/community-feed")}
          >
            <MessageSquare className="h-6 w-6 action-button-icon" />
            <span className="action-button-text">Community</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2 action-button"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "This feature is not yet available.",
              });
            }}
          >
            <Trophy className="h-6 w-6 action-button-icon" />
            <span className="action-button-text">Achievements</span>
          </Button>
        </div>

        {/* Issues Section */}
        <Card className="border rounded-xl shadow-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-white border-b">
            <CardTitle className="text-xl font-bold">Your Issues</CardTitle>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search issues..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IssueStatus | "all")}
                className="w-[180px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading && showLoadingIndicator ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loading />
                <p className="text-gray-500 mt-4">Loading your issues...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <p className="text-gray-800 text-lg">Sorry, we couldn't load your issues right now.</p>
                <Button 
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    // Try to refresh both the token and the query
                    if (auth.currentUser) {
                      auth.currentUser.getIdToken(true)
                        .then(newToken => {
                          setToken(newToken);
                          queryClient.invalidateQueries({ queryKey: ["/api/issues", token] });
                        })
                        .catch(err => {
                          console.error("Failed to refresh token:", err);
                          queryClient.invalidateQueries({ queryKey: ["/api/issues", token] });
                        });
                    } else {
                      queryClient.invalidateQueries({ queryKey: ["/api/issues", token] });
                    }
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm || statusFilter !== "all" ? (
                  <p className="text-gray-800 text-lg">No issues match your current filters.</p>
                ) : (
                  <p className="text-gray-800 text-lg">No issues reported yet.</p>
                )}
                <Button
                  className="mt-4 action-button"
                  onClick={() => navigate("/user/report-issue")}
                >
                  <PlusCircle className="mr-2 h-4 w-4 action-button-icon" />
                  <span className="action-button-text">Report an Issue</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue: Issue) => (
                  <div 
                    key={issue.id} 
                    className={`issue-card ${issue.severity ? `priority-${issue.severity.toLowerCase()}` : ''} ${issue.priority ? `priority-${issue.priority.toLowerCase()}` : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="issue-title">{issue.title || 'Untitled Issue'}</h3>
                        <p className="issue-description">{issue.description || 'No description provided'}</p>
                        <div className="issue-meta">
                          <div className="meta-item">
                            <span className="meta-label">Location</span>
                            <span className="meta-value flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {typeof issue.location === 'string' ? issue.location : 'Location not available'}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Reported</span>
                            <span className="meta-value flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {issue.assignedTo && (
                            <div className="meta-item">
                              <span className="meta-label">Assigned To</span>
                              <span className="meta-value">{issue.organizationName || 'An organization'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`status-badge status-${issue.status ? issue.status.toLowerCase().replace('_', '-') : 'open'}`}>
                          {issue.status?.replace("_", " ") || "open"}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="action-button mt-2"
                          onClick={() => navigate(`/user/issues/${issue.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2 action-button-icon" />
                          <span className="action-button-text">View Details</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
