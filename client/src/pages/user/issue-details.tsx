import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/ui/loading";
import { MapPin, Calendar, User, MessageSquare } from "lucide-react";
import React from "react";

export default function IssueDetails() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams() as { id: string };
  const issueId = params.id;
  const queryClient = useQueryClient();

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/issues/${issueId}`);
      if (!res.ok) throw new Error("Failed to fetch issue");
      return res.json();
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/issues/${issueId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  // Handle errors with useEffect
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch issue details",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading issue</div>;
  if (!issue) return <div>Issue not found</div>;

  const handleAddComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const content = new FormData(form).get("content") as string;
    if (!content.trim()) return;
    addCommentMutation.mutate(content);
    form.reset();
  };

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <Button variant="outline" onClick={() => navigate("/user/dashboard")} className="mb-6">
        Back to Dashboard
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{issue.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Reported by {issue.user.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{issue.location}</span>
              </div>
            </div>

            <div className="prose max-w-none">
              <p>{issue.description}</p>
            </div>

            {issue.imageUrl && (
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="rounded-lg max-h-[400px] object-cover"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddComment} className="mb-6">
            <Textarea
              name="content"
              placeholder="Add a comment..."
              className="mb-4"
              required
            />
            <Button type="submit" disabled={addCommentMutation.isPending}>
              {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
            </Button>
          </form>

          <div className="space-y-4">
            {comments.map((comment: any) => (
              <div key={comment.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  <span>{comment.user.name}</span>
                  <span>•</span>
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 