import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Issue as IssueType } from "../../types/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "../../components/ui/use-toast";
import { Loading } from "../../components/ui/loading";
import { useEffect, useState, useRef } from "react";
import { Footer } from '../../components/footer';
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FileText, Clock, BarChart3 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useIssueStore, type IssueStore, type Issue as StoreIssue } from "../../lib/issueStore";
import "../../styles/main.css";
import "../../styles/issues.css";

// Local interface for organization issues with additional fields
interface OrgIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string;
  createdAt: any; // Using 'any' to handle different date formats
  priority: string;
  issueType?: string; // Optional to handle potential missing field
  assignedTo?: string | null;
}

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
const transformIssues = (issues: any[]): OrgIssue[] => {
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
    
    return transformed as OrgIssue;
  });
};

export default function OrganizationDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(true);
  const { user, logout, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const [token, setToken] = useState<string | null>(null);
  const hasAttemptedFetch = useRef(false);
  const tokenRefreshAttempted = useRef(false);
  
  // Get demo issues from the store
  const demoIssues = useIssueStore((state: IssueStore) => state.demoIssues);
  // Get store action for updating assigned organization
  const assignIssue = useIssueStore((state: IssueStore) => state.assignIssue);
  
  const [userData, setUserData] = useState<{
    isOrganization: boolean;
    organizationName: string | null;
  }>({
    isOrganization: false,
    organizationName: null
  });

  // Effect to handle authentication token
  useEffect(() => {
    const getToken = async () => {
      try {
        if (auth.currentUser) {
          console.log("Getting token from auth.currentUser in org dashboard");
          const token = await auth.currentUser.getIdToken(true);
          console.log("Token obtained successfully for org dashboard");
          setToken(token);
          return token;
        }
        return null;
      } catch (error) {
        console.error("Error getting auth token in org dashboard:", error);
        return null;
      }
    };
    
    getToken();
    
    // Set up auth state listener to keep token updated
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      console.log("Auth state changed in org dashboard:", authUser ? "User signed in" : "User signed out");
      if (authUser) {
        getToken();
      } else {
        setToken(null);
      }
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Refresh user data if we have a user but no token
  useEffect(() => {
    if (user && !token && !tokenRefreshAttempted.current) {
      console.log("Have user but no token in org dashboard, refreshing user data");
      tokenRefreshAttempted.current = true;
      refreshUserData();
    }
  }, [user, token, refreshUserData]);

  // Update user data from auth context
  useEffect(() => {
    if (user) {
      setUserData({
        isOrganization: user.isOrganization === true,
        organizationName: user.displayName || user.email || null
      });
      
      // If user is not an organization, redirect to user dashboard
      if (!user.isOrganization && !user.role?.includes("organization")) {
        console.warn("Non-organization user attempting to access organization dashboard");
        toast({
          title: "Access Denied",
          description: "You don't have organization privileges",
          variant: "destructive"
        });
        navigate("/user/dashboard");
      }
    } else {
      // If no user at all, redirect to login
      navigate("/auth/login");
    }
  }, [user, navigate, toast]);

  // Set up query client subscription for live updates to assigned issues
  useEffect(() => {
    // Track when a new issue is added by another component
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // If organizational issues were updated, log it
      const orgIssuesData = queryClient.getQueryData<any>(['/api/organization/issues', token]);
      
      if (orgIssuesData) {
        console.log("Organization issues updated in cache:", orgIssuesData);
        // React Query will automatically update components using this data
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, token]);

  // Set a timeout to hide loading indicator after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingIndicator(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to get assigned issues from the demo issues
  const getAssignedDemoIssues = () => {
    if (!user?.uid) return [];
    
    // Filter demo issues that are assigned to this organization
    return demoIssues.filter((issue: OrgIssue) => issue.assignedTo === user.uid);
  };

  // Function to fetch issues
  const fetchOrgIssues = async (): Promise<OrgIssue[]> => {
    hasAttemptedFetch.current = true;
    
    if (!user) {
      console.error("Fetch organization issues called with no user");
      return getAssignedDemoIssues();
    }
    
    try {
      const currentToken = token || await auth.currentUser?.getIdToken(true);
      
      if (!currentToken) {
        console.error("No authentication token available for org dashboard");
        return getAssignedDemoIssues();
      }
      
      console.log("Making organization issues API request");
      
      const response = await fetch('/api/organization/issues', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to fetch issues";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error response from org issues API:", errorData);
        } catch (parseError) {
          console.error("Could not parse error response:", parseError);
        }
        
        // For 401/403 errors, we might need to refresh the token
        if (response.status === 401 || response.status === 403) {
          if (auth.currentUser) {
            console.log("Auth error - refreshing token for org dashboard");
            const newToken = await auth.currentUser.getIdToken(true);
            setToken(newToken);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Check if the response has the new format with 'issues' property
      const issuesData = data.issues || data;
      
      if (Array.isArray(issuesData)) {
        console.log(`Found ${data.count || issuesData.length} assigned issues`);
        return transformIssues(issuesData);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching organization issues:", error);
      setQueryError(error instanceof Error ? error.message : "An unknown error occurred");
      // Return demo issues assigned to this organization
      return getAssignedDemoIssues();
    }
  };
  
  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ["/api/organization/issues", token],
    queryFn: fetchOrgIssues,
    staleTime: 60000, // Cache data for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
    enabled: !!user?.isOrganization && !!token // Only fetch if we have an organization user with token
  });

  // Add state for query errors to display in UI
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setShowLoadingIndicator(false);
      setQueryError(error instanceof Error ? error.message : "An unknown error occurred fetching issues");
      toast({
        title: "Error",
        description: "Failed to fetch issues. Please try again later.",
        variant: "destructive",
      });
      
      // Update the cache with demo issues
      queryClient.setQueryData(["/api/organization/issues", token], getAssignedDemoIssues());
    }
  }, [error, toast, queryClient, token]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/issues/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/issues", token] });
      toast({ 
        title: "Success", 
        description: "Status updated successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const updatePriority = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: string }) => {
      const res = await fetch(`/api/issues/${id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/issues", token] });
      toast({ 
        title: "Success", 
        description: "Priority updated successfully" 
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    },
  });

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  // Handle updating issue status with local store update as well
  const handleUpdateStatus = (issueId: string, status: string) => {
    // Update in API
    updateStatus.mutate({ id: parseInt(issueId), status });
    
    // Also update in local store for offline support
    useIssueStore.getState().updateIssueStatus(issueId, status);
  };

  // Check if user is not organization or loading
  if (user && !user.isOrganization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You don't have organization privileges to access this dashboard.</p>
            <div className="flex space-x-4">
              <Button onClick={() => navigate("/user/dashboard")}>
                Go to User Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && showLoadingIndicator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-gray-500 mt-4">Loading assigned issues...</p>
      </div>
    );
  }

  const renderIssueCards = () => {
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-white rounded-lg shadow">
          <p className="text-gray-800 text-lg">No issues have been assigned to your organization yet.</p>
        </div>
      );
    }

    return (
      <div className="issues-grid">
        {issues.map((issue: OrgIssue) => (
          <div key={issue.id} className={`issue-card ${issue.priority ? `priority-${issue.priority.toLowerCase()}` : ''}`}>
            <div className="issue-header">
              <h3 className="issue-title">{issue.title}</h3>
              <span className={`status-badge status-${issue.status ? issue.status.toLowerCase().replace('_', '-') : 'open'}`}>
                {issue.status}
              </span>
            </div>
            <p className="issue-description">{issue.description}</p>
            <div className="issue-meta">
              <div className="meta-item">
                <span className="meta-label">Location:</span>
                <span className="meta-value">
                  {typeof issue.location === 'string' ? issue.location : 'Location not available'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Type:</span>
                <span className="meta-value">{issue.issueType || 'Not specified'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Priority:</span>
                <span className={`priority-badge priority-${issue.priority ? issue.priority.toLowerCase() : 'medium'}`}>
                  {issue.priority}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Reported:</span>
                <span className="meta-value">
                  {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
            </div>
            <div className="issue-actions">
              <Button variant="outline" size="sm" className="action-button">
                <FileText className="w-4 h-4 mr-2 action-button-icon" />
                <span className="action-button-text">View Details</span>
              </Button>
              <Button 
                className={`action-button ${
                  issue.status === 'open' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                  issue.status === 'in_progress' ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' :
                  'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
                size="sm"
                variant="outline"
                onClick={() => handleUpdateStatus(issue.id, 
                  issue.status === 'open' ? 'in_progress' : 
                  issue.status === 'in_progress' ? 'resolved' : 'open'
                )}
              >
                {issue.status === 'open' ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 action-button-icon" />
                    <span className="action-button-text">Start Working</span>
                  </>
                ) : issue.status === 'in_progress' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 action-button-icon" />
                    <span className="action-button-text">Mark Resolved</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2 action-button-icon" />
                    <span className="action-button-text">Reopen</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="dashboard-header">
        <div className="organization-badge">
          <span className="org-icon">🏢</span>
          <h1 className="dashboard-title">Organization Dashboard</h1>
        </div>
        <div className="organization-info">
          {userData.organizationName && (
            <h2 className="organization-name">{userData.organizationName}</h2>
          )}
          <p className="user-email">{user?.email}</p>
        </div>
        <Button onClick={handleSignOut} variant="outline" className="btn btn-secondary">
          Sign Out
        </Button>
      </div>
      
      <div className="dashboard-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">Total Assigned</h3>
                <p className="stats-value">{issues?.length || 0}</p>
              </div>
              <div className="text-indigo-500 stats-icon">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="stats-label">In Progress</h3>
                <p className="stats-value">
                  {(issues || []).filter((i: OrgIssue) => i.status === "in_progress").length}
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
                <h3 className="stats-label">Resolved</h3>
                <p className="stats-value">
                  {(issues || []).filter((i: OrgIssue) => i.status === "resolved").length}
                </p>
              </div>
              <div className="text-green-500 stats-icon">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="issues-section">
          <h2 className="section-title">Assigned Issues</h2>
        
          {queryError && (
            <div className="error-container bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-red-800 font-medium">Error fetching issues</h3>
              </div>
              <p className="text-red-700 mt-2">{queryError}</p>
            <Button 
                className="mt-4 bg-red-100 text-red-800 hover:bg-red-200"
                onClick={() => {
                  setQueryError(null);
                  if (auth.currentUser) {
                    auth.currentUser.getIdToken(true)
                      .then(newToken => {
                        setToken(newToken);
                        queryClient.invalidateQueries({ queryKey: ["/api/organization/issues", token] });
                      })
                      .catch(err => {
                        console.error("Failed to refresh token:", err);
                        queryClient.invalidateQueries({ queryKey: ["/api/organization/issues", token] });
                      });
                  } else {
                    queryClient.invalidateQueries({ queryKey: ["/api/organization/issues", token] });
                  }
                }}
              >
              Try Again
            </Button>
          </div>
          )}
          
          {isLoading || showLoadingIndicator ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loading />
              <p className="text-gray-500 mt-4">Loading assigned issues...</p>
            </div>
          ) : renderIssueCards()}
        </div>
      </div>
      <Footer />
    </div>
  );
}
