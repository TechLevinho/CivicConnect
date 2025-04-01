import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Issue as IssueType } from "../../types/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "../../components/ui/use-toast";
import { Loading } from "../../components/ui/loading";
import { useEffect, useState } from "react";
import { Footer } from '../../components/footer';
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/main.css";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string;
  createdAt: any; // Using 'any' to handle different date formats
  priority: string;
  issueType?: string; // Optional to handle potential missing field
}

export default function OrganizationDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<{
    isOrganization: boolean;
    organizationName: string | null;
  }>({
    isOrganization: false,
    organizationName: null
  });

  // Set a timeout to hide loading indicator after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingIndicator(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const { data: issues = [], isLoading, error } = useQuery<Issue[]>({
    queryKey: ["/api/issues/org/1"], // TODO: Get actual org ID
    staleTime: 60000, // Cache data for 1 minute
    refetchOnWindowFocus: false // Don't refetch on window focus
  });

  useEffect(() => {
    if (error) {
      setShowLoadingIndicator(false);
      toast({
        title: "Error",
        description: "Failed to fetch issues. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const token = await user?.getIdToken(true);
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            isOrganization: data.isOrganization,
            organizationName: data.organizationName
          });
          
          // If user is not an organization, redirect to user dashboard
          if (!data.isOrganization) {
            toast({
              title: "Access Denied",
              description: "You don't have organization privileges",
              variant: "destructive"
            });
            navigate("/user/dashboard");
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
    
    async function fetchIssues() {
      try {
        const token = await user?.getIdToken(true);
        const response = await fetch('/api/issues', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          queryClient.setQueryData(["/api/issues/org/1"], data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch issues",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setShowLoadingIndicator(false);
      }
    }
    
    if (user) {
      fetchUserDetails();
      fetchIssues();
    } else {
      navigate("/auth/login");
    }
  }, [user, navigate, toast, queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/issues/org/1"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/issues/org/1"] });
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

  if (isLoading && showLoadingIndicator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-gray-500 mt-4">Loading assigned issues...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
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
        <button onClick={handleSignOut} className="btn btn-secondary">
          Sign Out
        </button>
      </div>
      
      <div className="dashboard-content">
        <h2 className="section-title">Reported Issues</h2>
        
        {error ? (
          <div className="text-center py-8 px-4 bg-white rounded-lg shadow">
            <p className="text-gray-800 text-lg">Sorry, we couldn't load your assigned issues right now.</p>
            <Button 
              className="mt-4"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/issues/org/1"] })}
            >
              Try Again
            </Button>
          </div>
        ) : issues.length > 0 ? (
          <div className="issues-grid">
            {issues.map(issue => (
              <div key={issue.id} className="issue-card">
                <div className="issue-header">
                  <h3 className="issue-title">{issue.title}</h3>
                  <span className={`status-badge ${getStatusColor(issue.status || 'open')}`}>
                    {issue.status}
                  </span>
                </div>
                <p className="issue-description">{issue.description}</p>
                <div className="issue-meta">
                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{issue.location}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{issue.issueType || 'Not specified'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Priority:</span>
                    <span className={`priority-badge ${getPriorityColor(issue.priority || 'medium')}`}>
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
                  <button className="btn btn-small">View Details</button>
                  <button className="btn btn-small btn-primary">Update Status</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No issues have been reported yet.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
