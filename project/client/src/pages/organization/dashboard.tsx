import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Issue } from "@shared/schema";
import { IssueCard } from "@/components/issues/issue-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: issues, isLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues/org/1"], // TODO: Get actual org ID
  });

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
      toast({ title: "Success", description: "Status updated successfully" });
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
      toast({ title: "Success", description: "Priority updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Assigned Issues</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {issues?.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            showActions
            onStatusUpdate={(status) => updateStatus.mutate({ id: issue.id, status })}
            onPriorityUpdate={(priority) => updatePriority.mutate({ id: issue.id, priority })}
          />
        ))}
        
        {issues?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p>No issues have been assigned to your organization.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
