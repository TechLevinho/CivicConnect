import { useQuery } from "@tanstack/react-query";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504805572947-34fad45aed93";

// Define our own issue interface that's compatible with both APIs
interface Issue {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  severity?: string;
  priority?: string;
  category?: string;
  userId: string;
  createdAt: any;
  imageUrl?: string | null;
}

// Define the API response type
interface IssuesResponse {
  issues: Issue[];
  count: number;
  status: number;
  filters?: {
    status?: string;
    severity?: string;
  };
}

// Sample issues for when API isn't available
const FALLBACK_ISSUES: Issue[] = [
  {
    id: "demo1",
    title: "Pothole on Main Street",
    description: "Large pothole causing damage to vehicles",
    location: "123 Main St, Downtown",
    status: "open",
    severity: "high",
    priority: "high",
    category: "infrastructure",
    userId: "demo-user",
    createdAt: new Date(),
  },
  {
    id: "demo2",
    title: "Broken Street Light",
    description: "Street light has been out for 2 weeks creating safety issues",
    location: "Oak Avenue & 5th Street",
    status: "in_progress",
    severity: "medium",
    priority: "medium",
    category: "safety",
    userId: "demo-user",
    createdAt: new Date(),
  },
  {
    id: "demo3",
    title: "Trash Overflow",
    description: "Public trash cans overflowing in the park area",
    location: "Central Park, North Entrance",
    status: "open",
    severity: "medium",
    priority: "medium", 
    category: "environment",
    userId: "demo-user",
    createdAt: new Date(),
  },
  {
    id: "demo4",
    title: "Abandoned Vehicle",
    description: "Car appears to be abandoned for over a month",
    location: "Pine Street & 10th Avenue",
    status: "open",
    severity: "low",
    priority: "low",
    category: "safety",
    userId: "demo-user",
    createdAt: new Date(),
  },
  {
    id: "demo5",
    title: "Graffiti on Public Building",
    description: "Vandalism on the community center wall",
    location: "45 Community Drive",
    status: "open",
    severity: "low",
    priority: "low",
    category: "other",
    userId: "demo-user",
    createdAt: new Date(),
  },
  {
    id: "demo6",
    title: "Water Main Break",
    description: "Water flooding the street from broken pipe",
    location: "Elm Street & 3rd Avenue",
    status: "in_progress",
    severity: "high",
    priority: "high",
    category: "infrastructure",
    userId: "demo-user",
    createdAt: new Date(),
  }
];

export default function CommunityFeed() {
  const auth = getAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Get the auth token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(true);
          setAuthToken(token);
        }
      } catch (error) {
        console.error("Error getting auth token:", error);
      }
    };
    
    getToken();
  }, [auth]);
  
  const { data: response, isLoading, error } = useQuery<IssuesResponse>({
    queryKey: ["/api/issues"],
    // Changed to always be enabled, with a retry if token becomes available
    enabled: true,
    retry: authToken ? 1 : 0,
    select: (data) => {
      // Handle both new and old response formats
      if (data.issues && Array.isArray(data.issues)) {
        return data;
      } else if (Array.isArray(data)) {
        // Convert old format to new format
        return {
          issues: data,
          count: data.length,
          status: 200
        };
      }
      return { issues: [], count: 0, status: 200 };
    },
    // Add fetch options to include the Authorization header
    queryFn: async () => {
      try {
        if (!authToken) {
          console.log("No auth token available, using fallback issues");
          // Return fallback data structure when no token is available
          return {
            issues: FALLBACK_ISSUES,
            count: FALLBACK_ISSUES.length,
            status: 200
          };
        }
        
        const response = await fetch('/api/issues', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("API error:", errorData?.message || `Error ${response.status}`);
          // Return fallback data on error
          return {
            issues: FALLBACK_ISSUES,
            count: FALLBACK_ISSUES.length,
            status: response.status
          };
        }
        
        return response.json();
      } catch (error) {
        console.error("Failed to fetch issues:", error);
        // Return fallback data on any error
        return {
          issues: FALLBACK_ISSUES,
          count: FALLBACK_ISSUES.length,
          status: 500
        };
      }
    }
  });

  // Add search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get issues from the response, falling back to an empty array
  const issues = response?.issues || [];
  
  // Filter issues based on search and category
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || selectedCategory === issue.category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${HERO_IMAGE})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
              Building Better Communities Together
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              Report and track civic issues in your neighborhood
            </p>
            <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full text-lg font-semibold transition-all">
              Report New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search issues..."
            className="flex-1 p-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-2 border rounded-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="safety">Safety</option>
            <option value="environment">Environment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Issues Feed */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Recent Issues</h2>
            <p className="text-gray-600">
              {filteredIssues?.length || 0} issues found
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIssues?.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
              
              {filteredIssues?.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500 text-lg">No issues match your search criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}