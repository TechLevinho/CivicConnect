import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { IssueApi, CommentApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { type Issue, type Comment, type User } from "@/types/schema";

export default function IssueDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Make sure we have an ID
  if (!id) {
    return <div>Issue ID is required</div>;
  }

  // Query for the issue data
  const { data: issue, isLoading: isIssueLoading, error: issueError } = useQuery<Issue>({
    queryKey: ["issue", id],
    queryFn: () => IssueApi.getIssue(id),
  });

  // Query for the issue comments
  const { data: comments, isLoading: isCommentsLoading } = useQuery<Comment[]>({
    queryKey: ["issueComments", id],
    queryFn: () => CommentApi.getComments(id),
    enabled: !!id,
  });

  // Mutation for adding comments
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => CommentApi.addComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueComments", id] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for resolving the issue
  const resolveIssueMutation = useMutation({
    mutationFn: () => IssueApi.updateIssue(id, { status: "resolved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
      toast({
        title: "Issue resolved",
        description: "This issue has been marked as resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve issue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle comment submission
  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  // Handle resolving the issue
  const handleResolveIssue = () => {
    resolveIssueMutation.mutate();
  };

  // Loading state
  if (isIssueLoading) {
    return <div>Loading issue details...</div>;
  }

  // Error state
  if (issueError || !issue) {
    return <div>Error loading issue. Please try again.</div>;
  }

  return (
    <div className="container py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
        ← Back
      </button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{issue.title}</CardTitle>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:gap-4">
            <span>Reported on {issue.createdAt ? formatDate(issue.createdAt.toString()) : "Unknown date"}</span>
            <span>Status: <span className="font-medium capitalize">{issue.status}</span></span>
            <span>Severity: <span className="font-medium capitalize">{issue.severity}</span></span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">Description</h3>
            <p>{issue.description}</p>
          </div>

          {issue.location && (
            <div>
              <h3 className="mb-2 font-medium">Location</h3>
              <p>{typeof issue.location === 'string' ? issue.location : JSON.stringify(issue.location)}</p>
            </div>
          )}

          {issue.imageURL && (
            <div>
              <h3 className="mb-2 font-medium">Image</h3>
              <img 
                src={issue.imageURL} 
                alt="Issue" 
                className="mt-2 max-h-[400px] rounded-md object-cover"
              />
            </div>
          )}

          <div className="flex justify-end">
            {issue.status !== "resolved" && (
              <Button onClick={handleResolveIssue} disabled={resolveIssueMutation.isPending}>
                {resolveIssueMutation.isPending ? "Resolving..." : "Mark as Resolved"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCommentsLoading ? (
            <div>Loading comments...</div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-md border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{comment.userId}</span>
                    <span className="text-sm text-muted-foreground">
                      {comment.createdAt ? formatDate(comment.createdAt.toString()) : "Unknown date"}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div>No comments yet.</div>
          )}

          <div className="mt-6 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleAddComment} 
                disabled={addCommentMutation.isPending || !newComment.trim()}
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 