import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  priority: string;
  organizationName: string | null;
  createdAt: string;
}

interface PredefinedOrganization {
  id: number;
  name: string;
  description: string | null;
}

export default function IssueList() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");

  // Fetch organizations
  const { data: organizations = [] } = useQuery<PredefinedOrganization[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const response = await fetch("/api/organizations");
      if (!response.ok) throw new Error("Failed to fetch organizations");
      return response.json();
    },
  });

  // Fetch issues
  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: ["issues"],
    queryFn: async () => {
      const response = await fetch("/api/issues");
      if (!response.ok) throw new Error("Failed to fetch issues");
      return response.json();
    },
  });

  // Filter issues based on search, status, and organization
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      search === "" ||
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.description.toLowerCase().includes(search.toLowerCase()) ||
      issue.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesOrg = organizationFilter === "all" || issue.organizationName === organizationFilter;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issues</h1>
        <Button onClick={() => window.location.href = "/issues/create"}>Create Issue</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.name}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{issue.title}</h2>
                <p className="text-gray-600 mt-1">{issue.description}</p>
                <p className="text-sm text-gray-500 mt-2">Location: {issue.location}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(issue.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Badge className={getStatusColor(issue.status)}>
                  {issue.status.replace("_", " ")}
                </Badge>
                <Badge className={getPriorityColor(issue.priority)}>
                  {issue.priority}
                </Badge>
                {issue.organizationName && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {issue.organizationName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 