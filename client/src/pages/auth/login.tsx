import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/use-toast";
import { getAuth } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import "../../styles/main.css";
import "../../styles/auth.css";

// Error message mapping for Firebase error codes
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password. Please check your credentials and try again.",
  "auth/user-not-found": "No account found with this email. Please check your email or register.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/too-many-requests": "Too many failed login attempts. Please try again later or reset your password.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "default": "An error occurred during sign in. Please try again."
};

export default function Login() {
  const navigate = useNavigate();
  const { signIn, user, isOrganization, forceRedirectToDashboard } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const auth = getAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting...", { isOrganization });
      
      // Force a direct redirect based on organization status
      if (isOrganization) {
        console.log("Organization member logged in - redirecting to organization dashboard");
        navigate("/organization/dashboard");
      } else {
        console.log("Regular user logged in - redirecting to user dashboard");
        navigate("/user/dashboard");
      }
    }
  }, [user, navigate, isOrganization]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null); // Clear any previous errors

    try {
      // Basic form validation
      if (!formData.email.trim()) {
        setErrorMessage("Please enter your email address");
        setLoading(false);
        return;
      }

      if (!formData.password) {
        setErrorMessage("Please enter your password");
        setLoading(false);
        return;
      }

      // Sign in with Firebase
      await signIn(formData.email, formData.password);
      
      // Display success toast
      toast({
        title: "Success",
        description: "Successfully logged in!",
      });
      
      // The navigation will be handled by the useEffect when user state updates
      // We'll also handle it here as a fallback
      setTimeout(() => {
        // If we're still on the login page after 1 second, try to determine the proper route
        if (auth.currentUser) {
          console.log("Forcing redirect after login");
          
          try {
            // Use the forceRedirectToDashboard function from AuthContext
            forceRedirectToDashboard();
          } catch (error) {
            console.error("Error during redirect decision:", error);
            // Default to user dashboard as fallback
            navigate("/user/dashboard");
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle Firebase authentication errors
      if (error instanceof FirebaseError) {
        const errorCode = error.code;
        setErrorMessage(AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.default);
        
        // Log additional error details for debugging
        console.log("Firebase error details:", {
          code: error.code,
          message: error.message,
          customData: error.customData
        });
      } else {
        setErrorMessage("Failed to sign in. Please check your credentials and try again.");
      }
      
      toast({
        title: "Error",
        description: "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error message when user types
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Sign in to your account</h2>
          <p className="auth-subtitle">Enter your credentials to access your account</p>
        </div>
        
        {errorMessage && (
          <div className="auth-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{errorMessage}</p>
          </div>
        )}
        
        <div className="auth-form">
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
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
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input pr-10"
                  placeholder="Enter your password"
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

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/auth/register")}
                className="auth-button bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Create Account
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
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
