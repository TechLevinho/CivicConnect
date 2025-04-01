import { useQuery } from "@tanstack/react-query";
import { type Issue } from "../../types/schema";
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
  Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "../../components/ui/use-toast";
import { Loading } from "../../components/ui/loading";
import { Footer } from '../../components/footer';
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";

type IssueStatus = "open" | "in_progress" | "resolved";

// Fallback for when issues can't be loaded from the API
const DEMO_ISSUES: Issue[] = [
  {
    id: 1001,
    title: "Pothole on Main Street",
    description: "Large pothole that needs immediate repair",
    status: "open",
    location: "123 Main St",
    createdAt: new Date(),
    priority: "high",
    latitude: null,
    longitude: null,
    userId: 1,
    organizationName: null,
    updatedAt: null
  },
  {
    id: 1002,
    title: "Broken streetlight",
    description: "Streetlight has been out for several days",
    status: "in_progress",
    location: "456 Oak Ave",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    priority: "medium",
    latitude: null,
    longitude: null,
    userId: 1,
    organizationName: null,
    updatedAt: null
  },
  {
    id: 1003,
    title: "Garbage collection missed",
    description: "Tuesday pickup was missed this week",
    status: "resolved",
    location: "789 Pine Blvd",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    priority: "low",
    latitude: null,
    longitude: null,
    userId: 1,
    organizationName: null,
    updatedAt: null
  }
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const { user } = useAuth();

  // Set a timeout to hide loading indicator after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingIndicator(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchIssues = async (): Promise<Issue[]> => {
    if (!user) {
      console.error("Fetch issues called with no user");
      throw new Error("Not authenticated");
    }
    
    try {
      console.log("Fetching issues - starting authentication process");
      // Get the user's auth token
      const token = await user.getIdToken(true);
      console.log("Token obtained, making API request");
      
      const response = await fetch("/api/issues", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
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
        throw new Error(
          errorData.error || 
          errorData.message || 
          `Failed to fetch issues: ${response.status} ${response.statusText}`
        );
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} issues`);
      return data;
    } catch (error) {
      console.error("Error in fetchIssues:", error);
      // Force local data mode
      setUseLocalData(true);
      throw error;
    }
  };

  const { data: issues = [], isLoading, error } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
    queryFn: useLocalData ? () => Promise.resolve(DEMO_ISSUES) : fetchIssues,
    staleTime: 60000, // Cache data for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
    enabled: !!user // Only run query if user is authenticated
  });

  useEffect(() => {
    if (error) {
      setShowLoadingIndicator(false);
      toast({
        title: "Error",
        description: "Failed to fetch issues from the server. Showing demo data instead.",
        variant: "destructive",
      });
      
      // Switch to local data if we have an error
      setUseLocalData(true);
      
      // Update the query data with demo issues
      queryClient.setQueryData(["/api/issues"], DEMO_ISSUES);
    }
  }, [error, toast, queryClient]);

  const stats = [
    {
      label: "Total Issues",
      value: issues.length,
      icon: <AlertCircle className="h-6 w-6" />,
      color: "text-blue-500"
    },
    {
      label: "Resolved",
      value: issues.filter((i: Issue) => i.status === "resolved").length,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: "text-green-500"
    },
    {
      label: "In Progress",
      value: issues.filter((i: Issue) => i.status === "in_progress").length,
      icon: <Clock className="h-6 w-6" />,
      color: "text-yellow-500"
    },
    {
      label: "Points Earned",
      value: "1,234",
      icon: <Trophy className="h-6 w-6" />,
      color: "text-purple-500"
    }
  ];

  const filteredIssues = issues.filter((issue: Issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="container mx-auto py-8 px-4 flex-grow">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening in your community</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/user/report-issue")}
          >
            <MapPin className="h-6 w-6" />
            <span>Report Issue</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "This feature is not yet available.",
              });
            }}
          >
            <Bell className="h-6 w-6" />
            <span>Notifications</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate("/community-feed")}
          >
            <MessageSquare className="h-6 w-6" />
            <span>Community</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "This feature is not yet available.",
              });
            }}
          >
            <Trophy className="h-6 w-6" />
            <span>Achievements</span>
          </Button>
        </div>

        {/* Issues Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Issues</CardTitle>
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
          <CardContent>
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
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/issues"] })}
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
                  className="mt-4"
                  onClick={() => navigate("/user/report-issue")}
                >
                  Report an Issue
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue: Issue) => (
                  <Card key={issue.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{issue.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {issue.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            issue.status === "resolved" ? "bg-green-100 text-green-800" :
                            issue.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {issue.status?.replace("_", " ") || "open"}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/user/issues/${issue.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
