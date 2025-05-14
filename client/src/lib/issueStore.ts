// @ts-ignore - ignore zustand module resolution errors
import { create } from 'zustand';
// @ts-ignore - ignore zustand module resolution errors
import { persist } from 'zustand/middleware';

// Define the Issue interface
export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  location: string;
  createdAt: Date;
  priority: string;
  severity: string;
  category?: string;
  userId: string;
  assignedTo: string | null;
  imageUrl?: string | null;
}

// Initial demo issues
const initialDemoIssues: Issue[] = [
  {
    id: "1001",
    title: "Pothole on Main Street",
    description: "Large pothole that needs immediate repair near the intersection with Oak Avenue.",
    status: "open",
    location: "123 Main St",
    createdAt: new Date(),
    priority: "high",
    severity: "high",
    category: "infrastructure",
    userId: "user-1",
    assignedTo: null
  },
  {
    id: "1002",
    title: "Broken streetlight",
    description: "Streetlight has been out for several days causing safety concerns for pedestrians.",
    status: "in_progress",
    location: "456 Oak Ave",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    priority: "medium",
    severity: "medium",
    category: "electricity",
    userId: "user-1",
    assignedTo: null
  },
  {
    id: "1003",
    title: "Garbage collection missed",
    description: "Tuesday pickup was missed this week, trash bins still on the curb.",
    status: "resolved",
    location: "789 Pine Blvd",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    priority: "low",
    severity: "low",
    category: "garbage",
    userId: "user-1",
    assignedTo: null
  },
  {
    id: "1004",
    title: "Broken water pipe",
    description: "Water leaking from a broken pipe at the corner of Elm Street and River Road, causing flooding.",
    status: "in_progress",
    location: "101 Elm St",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    priority: "high",
    severity: "high",
    category: "water_supply",
    userId: "user-1",
    assignedTo: null
  },
  {
    id: "1005",
    title: "Fallen tree blocking sidewalk",
    description: "Large oak tree has fallen and is completely blocking the pedestrian path.",
    status: "open",
    location: "250 Forest Ave",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    priority: "medium",
    severity: "medium",
    category: "environment",
    userId: "user-1",
    assignedTo: null
  }
];

// Define the store
export interface IssueStore {
  // State
  demoIssues: Issue[];
  
  // Actions
  addIssue: (issue: Partial<Issue>) => void;
  assignIssue: (issueId: string, organizationId: string) => void;
  updateIssueStatus: (issueId: string, status: string) => void;
}

// Create the store with persistence
export const useIssueStore = create<IssueStore>()(
  persist(
    (set) => ({
      demoIssues: initialDemoIssues,
      
      // Add a new issue and keep only the 5 most recent
      addIssue: (issue: Partial<Issue>) => set((state: IssueStore) => {
        // Create a new issue with required properties
        const newIssue: Issue = {
          id: `demo-${Date.now()}`,
          title: issue.title || "New Issue",
          description: issue.description || "No description provided",
          status: "open",
          location: issue.location || "Unknown location",
          createdAt: new Date(),
          priority: issue.priority || "medium",
          severity: issue.severity || "medium",
          category: issue.category || "general",
          userId: issue.userId || "user-1",
          assignedTo: issue.assignedTo || null,
          imageUrl: issue.imageUrl || null
        };
        
        // Automatically assign based on category if not already assigned
        if (!newIssue.assignedTo && newIssue.category) {
          // Map categories to organization IDs 
          // This is a simplified approach - in a real app, you'd get this from the server
          const categoryOrgMap: Record<string, string> = {
            "infrastructure": "org-infrastructure",
            "water_supply": "org-water",
            "electricity": "org-electricity",
            "environment": "org-environment",
            "safety": "org-safety",
            "garbage": "org-garbage",
          };
          
          // Assign to the appropriate organization based on category
          if (newIssue.category in categoryOrgMap) {
            newIssue.assignedTo = categoryOrgMap[newIssue.category];
            console.log(`Assigned issue to organization: ${newIssue.assignedTo} based on category: ${newIssue.category}`);
          }
        }
        
        // Add the new issue at the beginning and keep only the 5 most recent
        const updatedIssues = [newIssue, ...state.demoIssues.slice(0, 4)];
        
        return {
          demoIssues: updatedIssues,
        };
      }),
      
      // Assign an issue to an organization
      assignIssue: (issueId: string, organizationId: string) => set((state: IssueStore) => ({
        demoIssues: state.demoIssues.map(issue => 
          issue.id === issueId 
            ? { ...issue, assignedTo: organizationId } 
            : issue
        ),
      })),
      
      // Update an issue's status
      updateIssueStatus: (issueId: string, status: string) => set((state: IssueStore) => ({
        demoIssues: state.demoIssues.map(issue => 
          issue.id === issueId 
            ? { ...issue, status } 
            : issue
        ),
      })),
    }),
    {
      name: 'civicconnect-issues', // storage key
    }
  )
); 