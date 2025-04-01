import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  IssueType, 
  ISSUE_TYPES, 
  getOrganizationsByIssueType, 
  Organization
} from "@/lib/organization-data";

export default function CreateIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [priority, setPriority] = useState("medium");
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);

  // Update organizations list when issue type changes
  useEffect(() => {
    if (issueType) {
      setFilteredOrganizations(getOrganizationsByIssueType(issueType as IssueType));
      // Clear selected organization when issue type changes
      setOrganizationName(null);
    } else {
      setFilteredOrganizations([]);
    }
  }, [issueType]);

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (issueData: {
      title: string;
      description: string;
      location: string;
      latitude: string;
      longitude: string;
      priority: string;
      issueType: string;
      organizationName: string | null;
    }) => {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData),
      });
      if (!response.ok) throw new Error("Failed to create issue");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
      navigate("/issues");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      latitude,
      longitude,
      priority,
      issueType,
      organizationName,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Issue</h1>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Latitude</label>
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Enter latitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Longitude</label>
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Enter longitude"
            />
          </div>
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
          <label className="block text-sm font-medium mb-2">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
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
            value={organizationName || ""} 
            onValueChange={(value) => setOrganizationName(value || null)}
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
              {filteredOrganizations.map((org) => (
                <SelectItem key={org.id} value={org.name}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {issueType && (
            <p className="text-sm text-gray-500 mt-1">
              Only organizations that handle {ISSUE_TYPES.find(t => t.id === issueType)?.label.toLowerCase()} are shown
            </p>
          )}
        </div>

        <Button type="submit" disabled={createIssueMutation.isPending}>
          {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
        </Button>
      </form>
    </div>
  );
} 