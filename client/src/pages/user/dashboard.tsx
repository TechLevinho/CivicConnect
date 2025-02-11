import { useQuery } from "@tanstack/react-query";
import { type Issue } from "@shared/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UserDashboard() {
  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues/user/1"], // TODO: Get actual user ID
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Reported Issues</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues?.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
        
        {issues?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You haven't reported any issues yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
