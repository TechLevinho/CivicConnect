import { createContext, useContext, useState, useEffect } from "react";
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { useToast } from "../components/ui/use-toast";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  userId: string;
  organizationName?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  issueId: string;
  createdAt: Date;
}

interface Organization {
  name: string;
  description: string | null;
}

interface FirestoreContextType {
  issues: Issue[];
  comments: Record<string, Comment[]>;
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  createIssue: (data: Omit<Issue, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateIssueStatus: (issueId: string, status: Issue["status"]) => Promise<void>;
  updateIssuePriority: (issueId: string, priority: Issue["priority"]) => Promise<void>;
  assignIssue: (issueId: string, organizationName: string) => Promise<void>;
  createComment: (issueId: string, content: string) => Promise<void>;
}

const FirestoreContext = createContext<FirestoreContextType | null>(null);

export function FirestoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIssues([]);
      setComments({});
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch issues
        const issuesQuery = query(
          collection(db, "issues"),
          orderBy("createdAt", "desc")
        );
        const issuesSnapshot = await getDocs(issuesQuery);
        const issuesData = issuesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Issue[];
        setIssues(issuesData);

        // Fetch comments
        const commentsQuery = query(
          collection(db, "comments"),
          orderBy("createdAt", "desc")
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Comment[];
        
        const commentsByIssue = commentsData.reduce((acc, comment) => {
          if (!acc[comment.issueId]) {
            acc[comment.issueId] = [];
          }
          acc[comment.issueId].push(comment);
          return acc;
        }, {} as Record<string, Comment[]>);
        
        setComments(commentsByIssue);

        // Fetch organizations
        const organizationsQuery = query(collection(db, "organizations"));
        const organizationsSnapshot = await getDocs(organizationsQuery);
        const organizationsData = organizationsSnapshot.docs.map(doc => ({
          ...doc.data()
        })) as Organization[];
        setOrganizations(organizationsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to fetch data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const createIssue = async (data: Omit<Issue, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const issueData = {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "issues"), issueData);
      toast({
        title: "Success",
        description: "Issue created successfully",
      });
    } catch (error) {
      console.error("Error creating issue:", error);
      toast({
        title: "Error",
        description: "Failed to create issue. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateIssueStatus = async (issueId: string, status: Issue["status"]) => {
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        status,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Success",
        description: "Issue status updated successfully",
      });
    } catch (error) {
      console.error("Error updating issue status:", error);
      toast({
        title: "Error",
        description: "Failed to update issue status. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateIssuePriority = async (issueId: string, priority: Issue["priority"]) => {
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        priority,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Success",
        description: "Issue priority updated successfully",
      });
    } catch (error) {
      console.error("Error updating issue priority:", error);
      toast({
        title: "Error",
        description: "Failed to update issue priority. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignIssue = async (issueId: string, organizationName: string) => {
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        organizationName,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Success",
        description: "Issue assigned successfully",
      });
    } catch (error) {
      console.error("Error assigning issue:", error);
      toast({
        title: "Error",
        description: "Failed to assign issue. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createComment = async (issueId: string, content: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const commentData = {
        content,
        userId: user.uid,
        issueId,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "comments"), commentData);
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <FirestoreContext.Provider
      value={{
        issues,
        comments,
        organizations,
        loading,
        error,
        createIssue,
        updateIssueStatus,
        updateIssuePriority,
        assignIssue,
        createComment
      }}
    >
      {children}
    </FirestoreContext.Provider>
  );
}

export function useFirestore() {
  const context = useContext(FirestoreContext);
  if (!context) {
    throw new Error("useFirestore must be used within a FirestoreProvider");
  }
  return context;
} 