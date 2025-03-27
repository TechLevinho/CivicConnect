import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Issue } from "@shared/schema";

interface IssueCardProps {
  issue: Issue;
  onStatusUpdate?: (status: string) => void;
  onPriorityUpdate?: (priority: string) => void;
  showActions?: boolean;
}

const statusColors: Record<string, string> = {
  reported: "bg-yellow-500",
  "in-progress": "bg-blue-500",
  resolved: "bg-green-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500",
  medium: "bg-orange-500",
  high: "bg-red-500",
};

export function IssueCard({ issue, onStatusUpdate, onPriorityUpdate, showActions = false }: IssueCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{issue.title}</CardTitle>
          <div className="flex gap-2">
            <Badge className={statusColors[issue.status]}>{issue.status}</Badge>
            <Badge className={priorityColors[issue.priority]}>{issue.priority}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-2">{issue.description}</p>
        <p className="text-sm text-gray-500">📍 {issue.location}</p>
        {issue.imageUrl && (
          <img 
            src={issue.imageUrl} 
            alt="Issue" 
            className="mt-4 rounded-md w-full h-48 object-cover"
          />
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          <select
            className="border rounded p-1 text-sm"
            value={issue.status}
            onChange={(e) => onStatusUpdate?.(e.target.value)}
          >
            <option value="reported">Reported</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            className="border rounded p-1 text-sm"
            value={issue.priority}
            onChange={(e) => onPriorityUpdate?.(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </CardFooter>
      )}
    </Card>
  );
}
