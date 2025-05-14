import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/use-toast";
import { getAllOrganizations } from "../../lib/organization-data";
import { db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../../styles/main.css";
import "../../styles/auth.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOrganization, setIsOrganization] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [departmentType, setDepartmentType] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get all organizations from our predefined list
  const organizations = getAllOrganizations();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form inputs
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Organization-specific validation
      if (isOrganization) {
        if (!organizationId) {
          toast({
            title: "Error",
            description: "Please select your organization.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!displayName) {
          toast({
            title: "Error",
            description: "Please enter a display name for your organization.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!departmentType) {
          toast({
            title: "Error",
            description: "Please select a department type.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // First register with Firebase
      console.log("Starting Firebase registration...");
      const userCredential = await signUp(email, password);
      console.log("Firebase registration successful:", userCredential.user.uid);
      
      // Get the current user
      const currentUser = userCredential.user;
      
      // Find the selected organization to get its full details
      const selectedOrg = isOrganization ? 
        organizations.find(org => org.id === organizationId) : null;
      
      if (isOrganization && selectedOrg) {
        try {
          console.log("Creating organization document in Firestore...");
          
          // Get display name for the department type
          const departmentTypeDisplay = departmentType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Create the organization document in Firestore
          const orgDocRef = doc(db, "organizations", currentUser.uid);
          
          // Organization data to save
          const orgData = {
            uid: currentUser.uid,
            email: email,
            role: "organization",
            isOrganization: true,
            department_type: departmentType,
            department_type_display: departmentTypeDisplay,
            name: displayName,
            organization_id: selectedOrg.id,
            organization_name: selectedOrg.name,
            issue_categories: [departmentType], // Store as array for future expansion
            assigned_issues: [],
            createdAt: serverTimestamp()
          };
          
          // Write to Firestore
          await setDoc(orgDocRef, orgData);
          console.log("Organization document created successfully:", orgData);
          
          toast({
            title: "Success",
            description: "Your organization profile has been created!",
          });
          
          // Now send the data to our backend API as well for custom claims
          await sendProfileDataToBackend(currentUser, {
            ...orgData,
            isOrganization: true,
            organizationName: orgData.name,
            organizationId: selectedOrg.id
          });
          
          // Force token refresh to ensure claims are updated
          await currentUser.getIdToken(true);
          
          // Wait a moment for token propagation
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh user data in context to ensure organization status is set
          await refreshUserData();
          
          // Navigate to organization dashboard
          console.log("Registration complete. Redirecting to organization dashboard.");
          setTimeout(() => {
            navigate("/organization/dashboard");
          }, 500);
        } catch (firestoreError) {
          console.error("Error creating organization in Firestore:", firestoreError);
          console.error("Full error details:", JSON.stringify(firestoreError, null, 2));
          
          if (firestoreError instanceof Error && firestoreError.stack) {
            console.error("Error stack:", firestoreError.stack);
          }
          
          toast({
            title: "Organization Setup Failed",
            description: "There was a problem setting up your organization. Please try again or contact support.",
            variant: "destructive",
          });
          setLoading(false);
        }
      } else {
        // Regular user flow
        const userData = {
          uid: currentUser.uid,
          email: email,
          isOrganization: false,
          role: "user"
        };
        
        // Send to backend API for custom claims
        await sendProfileDataToBackend(currentUser, userData);
        
        // Force token refresh
        await currentUser.getIdToken(true);
        
        // Refresh user data in context
        await refreshUserData();
        
        // Navigate to user dashboard
        console.log("Registration complete. Redirecting to user dashboard.");
        setTimeout(() => {
          navigate("/user/dashboard");
        }, 500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  // Helper function to send profile data to backend
  const sendProfileDataToBackend = async (
    user: { uid: string },
    profileData: {
      uid: string;
      email: string;
      isOrganization?: boolean;
      role: string;
      [key: string]: any;
    }
  ) => {
    try {
      console.log("Sending user data to backend:", profileData);
      
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Profile update failed with status:", response.status);
        console.error("Error response:", errorText);
        throw new Error(errorText || `Profile update failed with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("Backend response:", responseData);
      return true;
    } catch (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      console.error("Full error details:", JSON.stringify(profileUpdateError, null, 2));
      
      // Log the stack trace if available
      if (profileUpdateError instanceof Error && profileUpdateError.stack) {
        console.error("Error stack:", profileUpdateError.stack);
      }
      
      // Show a notification but don't block the flow
      toast({
        title: "Warning",
        description: "Your account was created but profile synchronization may be incomplete. Some features might be limited.",
        variant: "destructive",
      });
      
      // Continue since the Firebase account and Firestore doc were created
      console.log("Continuing despite profile API update error");
      return false;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join CivicConnectt to report and track issues in your community</p>
        </div>
        
        <div className="auth-form">
          <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="email" className="auth-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input pr-10"
                placeholder="Create a password"
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input pr-10"
                placeholder="Confirm your password"
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-checkbox-container">
            <input
              type="checkbox"
              name="isOrganization"
              id="isOrganization"
              checked={isOrganization}
              onChange={(e) => setIsOrganization(e.target.checked)}
              className="auth-checkbox"
            />
            <label htmlFor="isOrganization" className="auth-checkbox-label">
              Register as an organization
            </label>
          </div>

          {isOrganization && (
            <div className="org-form-section animate-fade-in">
              <h3 className="org-form-title">Organization Information</h3>
              <p className="text-sm text-blue-600 mb-4">
                Please provide details about your organization to register as an organization member.
              </p>

              <div className="form-group">
                <label htmlFor="organizationId" className="form-label required-field">
                  Organization Name
                </label>
                <select
                  id="organizationId"
                  name="organizationId"
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    // Reset department type when organization changes
                    setDepartmentType("");
                  }}
                  className="form-select"
                  required={isOrganization}
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the parent organization you belong to
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="displayName" className="form-label required-field">
                  Display Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  autoComplete="organization-name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input"
                  placeholder="Enter your organization's display name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This is how your organization will be displayed in the system
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="departmentType" className="form-label required-field">
                  Department Type
                </label>
                <select
                  id="departmentType"
                  name="departmentType"
                  value={departmentType}
                  onChange={(e) => setDepartmentType(e.target.value)}
                  className="form-select"
                  required={isOrganization}
                  disabled={!organizationId}
                >
                  <option value="">Select a department type</option>
                  {!organizationId ? (
                    <option disabled>Please select an organization first</option>
                  ) : (
                    organizations
                      .find(org => org.id === organizationId)
                      ?.issueTypes.map((type: string) => {
                        // Convert ID format to display format (e.g., "water_supply" to "Water Supply")
                        const displayName = type
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                          
                        return (
                          <option key={type} value={type}>
                            {displayName}
                          </option>
                        );
                      })
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  The department type determines which issue categories your organization can handle
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="auth-button bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Sign In
            </button>
            <button
              type="submit"
              disabled={loading}
              className="auth-button bg-gradient-to-r from-indigo-600 to-indigo-500"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
