import { useQuery } from "@tanstack/react-query";
import { type Issue } from "@shared/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504805572947-34fad45aed93";

// ... existing code ...

export default function CommunityFeed() {
  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
  });

  // Add search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter issues based on search and category
  const filteredIssues = issues?.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
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