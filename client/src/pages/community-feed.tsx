import { useQuery } from "@tanstack/react-query";
import { type Issue } from "@shared/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardContent } from "@/components/ui/card";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504805572947-34fad45aed93";

export default function CommunityFeed() {
  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues"],
  });

  return (
    <div>
      {/* Hero Section */}
      <div 
        className="relative h-[400px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${HERO_IMAGE})`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Building Better Communities Together
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              Report and track civic issues in your neighborhood
            </p>
          </div>
        </div>
      </div>

      {/* Issues Feed */}
      <div className="container mx-auto py-12">
        <h2 className="text-3xl font-bold mb-8">Recent Issues</h2>
        
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues?.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
            
            {issues?.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <p>No issues have been reported yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
