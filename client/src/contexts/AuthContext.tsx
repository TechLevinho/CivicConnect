import { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential,
  setPersistence,
  browserLocalPersistence,
  getAuth
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Extended user interface with custom properties
interface User {
  uid: string;
  email: string | null;
  role: string;
  isOrganization?: boolean;
  displayName?: string;
  profile?: any;
  // Other Firebase properties we might need
  emailVerified: boolean;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential | void>;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  isOrganization: boolean;
  forceRedirectToDashboard: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isOrganization, setIsOrganization] = useState(false);
  
  // Used for navigation
  const navigate = useNavigate();

  // Set persistence to LOCAL (survives browser refreshes)
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase auth persistence set to LOCAL");
      } catch (error) {
        console.error("Error setting persistence:", error);
      } finally {
        setAuthInitialized(true);
      }
    };
    
    setupPersistence();
  }, []);

  // Function to fetch user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      // Get user's custom claims
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = idTokenResult.claims as {
        role?: string;
        isOrganization?: boolean;
        [key: string]: any;
      };
      
      // Base user object with required properties
      const baseUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL,
        role: claims.role || "user",
        isOrganization: claims.isOrganization === true || claims.role === "organization"
      };

      // First check if user exists in organizations collection
      // This takes precedence over the users collection
      const orgDoc = await getDoc(doc(db, "organizations", firebaseUser.uid));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        console.log("Organization data found in Firestore:", orgData);
        setIsOrganization(true);
        return { 
          ...baseUser, 
          role: "organization",
          isOrganization: true,
          displayName: orgData.name || orgData.displayName,
          profile: orgData
        };
      }
      
      // Check if user exists in users collection
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        // User exists in users collection
        const userData = userDoc.data();
        const isOrg = userData.role === "organization" || userData.isOrganization === true;
        setIsOrganization(isOrg);
        return { 
          ...baseUser, 
          role: userData.role || "user",
          isOrganization: isOrg,
          displayName: userData.name || userData.displayName,
          profile: userData
        };
      } 
      
      // If we couldn't find the user in either collection but have claims,
      // use the claims data and fetch from API as a backup
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
          }
        });
        
        if (response.ok) {
          const apiUserData = await response.json();
          const isOrg = apiUserData.isOrganization === true || apiUserData.role === "organization";
          setIsOrganization(isOrg);
          return {
            ...baseUser,
            role: apiUserData.role || baseUser.role,
            isOrganization: isOrg,
            displayName: apiUserData.displayName || apiUserData.name,
            profile: apiUserData
          };
        }
      } catch (apiError) {
        console.warn("Failed to fetch user data from API:", apiError);
      }
      
      // New user with no profile yet - default to isOrganization from claims
      setIsOrganization(baseUser.isOrganization === true);
      return { 
        ...baseUser,
        profile: null
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      
      // Fallback to basic user object if we can't fetch additional data
      setIsOrganization(false);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL,
        role: "user",
        isOrganization: false
      };
    }
  };

  // Function to refresh user data on demand
  const refreshUserData = async () => {
    if (!auth.currentUser) {
      console.log("Cannot refresh user data - no current user");
      return;
    }
    
    try {
      console.log("Refreshing user data...");
      const userData = await fetchUserData(auth.currentUser);
      setUser(userData);
      console.log("User data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    // Only set up the auth state listener after persistence is configured
    if (!authInitialized) return;
    
    console.log("Setting up Firebase auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User signed in" : "User signed out");
      
      if (firebaseUser) {
        try {
          const userData = await fetchUserData(firebaseUser);
          
          // Set the isOrganization flag based on the user data
          const isOrg = userData.isOrganization === true || userData.role === "organization";
          setIsOrganization(isOrg);
          console.log(`User authenticated with isOrganization=${isOrg}`);
          
          // Store the user data
          setUser(userData);
          
          // Optionally redirect based on organization status
          if (navigate) {
            // Only navigate if we're not already on the correct dashboard
            const currentPath = window.location.pathname;
            const correctPath = isOrg ? "/organization/dashboard" : "/user/dashboard";
            
            // Check if we're on a dashboard page but the wrong one
            if (currentPath.includes("/dashboard") && !currentPath.includes(isOrg ? "organization" : "user")) {
              console.log(`User is on wrong dashboard (${currentPath}), redirecting to ${correctPath}`);
              navigate(correctPath);
            }
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          
          // Set a minimal user object if we can't get complete data
          // This prevents the user from being completely logged out due to data fetch errors
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL,
            role: "user",
            isOrganization: false
          });
          
          setIsOrganization(false);
        }
      } else {
        setUser(null);
        setIsOrganization(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [authInitialized, navigate]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Attempting to sign in with email and password");
      // Ensure email is trimmed to avoid whitespace issues
      const trimmedEmail = email.trim();
      
      // First check browser connectivity
      if (!navigator.onLine) {
        console.error("Sign in failed: Browser is offline");
        throw new Error("You appear to be offline. Please check your internet connection and try again.");
      }
      
      // Attempt authentication
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log("Firebase sign-in successful");
      
      // Force token refresh to ensure we have the latest claims
      if (userCredential.user) {
        try {
          await userCredential.user.getIdToken(true);
          console.log("User token refreshed after login");
        } catch (tokenError) {
          console.warn("Token refresh failed, but login succeeded:", tokenError);
          // Continue even if token refresh fails - onAuthStateChanged will still trigger
        }
      }
      
      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error);
      // Let the error propagate to the component for handling
      throw error;
    } finally {
      // Loading will be set to false by the onAuthStateChanged handler
      // But we'll set it here too as a fallback
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } finally {
      // Loading will be set to false by the onAuthStateChanged handler
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, we'll still clear the local user state
      setUser(null);
    }
  };

  // Function to force redirect to the correct dashboard based on user type
  const forceRedirectToDashboard = () => {
    if (!user) return;
    
    // Directly use the isOrganization state rather than deriving it from user
    console.log("Force redirecting to dashboard based on user type:", 
      isOrganization ? "organization" : "user", 
      { userIsOrg: user.isOrganization, userRole: user.role, contextIsOrg: isOrganization }
    );
    
    if (isOrganization) {
      navigate("/organization/dashboard");
    } else {
      navigate("/user/dashboard");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, refreshUserData, isOrganization, forceRedirectToDashboard }}>
      {(!loading || user) && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 