import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { IssueApi } from "@/lib/api";
import { 
  IssueType, 
  ISSUE_TYPES, 
  getOrganizationsByIssueType, 
  Organization
} from "@/lib/organization-data";

export default function CreateIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);

  // Update organizations list when issue type changes
  useEffect(() => {
    if (issueType) {
      setFilteredOrganizations(getOrganizationsByIssueType(issueType as IssueType));
      // Clear selected organization when issue type changes
      setAssignedTo(null);
    } else {
      setFilteredOrganizations([]);
    }
  }, [issueType]);

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: (issueData: {
      title: string;
      description: string;
      location: string;
      imageURL?: string;
      severity: string;
      assignedTo?: string | null;
    }) => {
      return IssueApi.createIssue(issueData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Issue reported successfully",
      });
      navigate("/user/issues");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to report issue",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report an issue",
        variant: "destructive"
      });
      return;
    }

    if (!issueType) {
      toast({
        title: "Error",
        description: "Please select an issue type",
        variant: "destructive"
      });
      return;
    }

    createIssueMutation.mutate({
      title,
      description,
      location,
      imageURL: imageURL || undefined,
      severity,
      assignedTo,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Report New Issue</h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter issue title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Describe the issue"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="Enter location"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
          <Input
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="Enter image URL if available"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Issue Type</label>
          <Select 
            value={issueType} 
            onValueChange={(value) => setIssueType(value as IssueType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Severity</label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Assign to Organization</label>
          <Select 
            value={assignedTo || ""} 
            onValueChange={(value) => setAssignedTo(value || null)}
            disabled={!issueType || filteredOrganizations.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !issueType 
                  ? "Select an issue type first" 
                  : filteredOrganizations.length === 0 
                    ? "No organizations available for this issue type" 
                    : "Select organization"
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {filteredOrganizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={createIssueMutation.isPending}
          >
            {createIssueMutation.isPending ? "Submitting..." : "Report Issue"}
          </Button>
        </div>
      </form>
    </div>
  );
} 