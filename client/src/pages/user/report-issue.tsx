import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import "../../styles/main.css";
import "../../styles/issues.css";
import { Upload, X, MapPin, Camera, FileImage, Send, AlertTriangle } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useIssueStore, type IssueStore } from "../../lib/issueStore";
import { Button } from "@/components/ui/button";

export default function ReportIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = getAuth();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Get issueStore methods
  const addIssue = useIssueStore((state: IssueStore) => state.addIssue);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "general"
  });

  // Create issue mutation using React Query
  const createIssueMutation = useMutation({
    mutationFn: async (newIssue: any) => {
      const token = await auth.currentUser?.getIdToken(true);
      
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newIssue)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error ${response.status}: Failed to create issue`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch queries to update dashboards
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organization/issues'] });
      
      // Use setQueryData to immediately update the UI with the new issue
      queryClient.setQueryData(['/api/issues'], (oldData: any) => {
        if (!oldData) return { issues: [data.issue], count: 1, status: 200 };
        
        // Handle both new and old response formats
        if (oldData.issues && Array.isArray(oldData.issues)) {
          return {
            ...oldData,
            issues: [data.issue, ...oldData.issues],
            count: (oldData.count || 0) + 1
          };
        } 
        
        // If it's just an array
        if (Array.isArray(oldData)) {
          return [data.issue, ...oldData];
        }
        
        return oldData;
      });
      
      toast({
        title: "Success",
        description: "Issue reported successfully!"
      });
      
      navigate("/user/dashboard");
    },
    onError: (error) => {
      console.error("API Error:", error);
      
      // If API fails, still add to local store
      const fallbackIssue = handleFallbackIssue();
      
      toast({
        title: "Partial Success",
        description: "Issue saved locally. Will sync when online."
      });
      
      navigate("/user/dashboard");
    }
  });

  // Helper function to create a fallback issue for the store
  const handleFallbackIssue = () => {
    const imageUrl = photos.length > 0 ? photos[0] : null;
    
    // Create a new issue object for the local store
    const newIssue = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      imageUrl,
      severity: "medium", // Default severity
      userId: user?.uid || "anonymous",
      status: "open",
      // This will automatically assign to organization based on category in the store
      // We'll leave assignedTo as null and let the server/store handle assignment
      assignedTo: null 
    };
    
    // Add to the Zustand store
    addIssue(newIssue);
    
    // Also add this issue to the cache for immediate display
    updateQueryCache(newIssue);
    
    return newIssue;
  };

  // Function to update React Query cache with the new issue
  const updateQueryCache = (issue: any) => {
    // Update the user issues cache
    queryClient.setQueryData(['/api/issues'], (oldData: any) => {
      if (!oldData) return { issues: [issue], count: 1, status: 200 };
      
      // Handle both new and old response formats
      if (oldData.issues && Array.isArray(oldData.issues)) {
        return {
          ...oldData,
          issues: [issue, ...oldData.issues],
          count: (oldData.count || 0) + 1
        };
      } 
      
      // If it's just an array
      if (Array.isArray(oldData)) {
        return [issue, ...oldData];
      }
      
      return oldData;
    });
    
    // Also try to update the organization issues cache if there's already data there
    // This will ensure the issue shows up in the organization dashboard immediately
    if (issue.category) {
      queryClient.invalidateQueries({ queryKey: ['/api/organization/issues'] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert photos array to URLs or references if needed
      // This is simplistic - in a real app, you'd likely upload these to a storage service first
      const imageUrl = photos.length > 0 ? photos[0] : null;
      
      // Create the new issue object
      const newIssue = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category,
        imageUrl
      };
      
      console.log("Submitting new issue:", newIssue);
      
      // Use the mutation to create the issue
      await createIssueMutation.mutateAsync(newIssue);
      
      // Also update the local store to ensure consistency
      addIssue({
        ...newIssue,
        severity: "medium", // Default severity
        userId: user?.uid || "anonymous",
        status: "open"
      });

      // Explicitly update the query cache for both dashboards
      updateQueryCache({
        ...newIssue,
        id: `demo-${Date.now()}`, // In case we can't get real ID from mutation
        severity: "medium",
        userId: user?.uid || "anonymous",
        status: "open"
      });
      
      // Reset form (mutation's onSuccess will handle navigation)
      setFormData({
        title: "",
        description: "",
        location: "",
        category: "general"
      });
      setPhotos([]);
    } catch (error) {
      console.error("Error reporting issue:", error);
      
      // Even if the API call fails, store the issue locally
      handleFallbackIssue();
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to report issue. Issue saved locally.",
        variant: "destructive",
      });
      setLoading(false);
      
      // Navigate to dashboard even in case of error since we saved locally
      navigate("/user/dashboard");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          toast({
            title: "Location Found",
            description: "Your current location has been added",
          });
        },
        () => {
          toast({
            title: "Error",
            description: "Unable to get your location. Please enter it manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="form-container">
        <h2 className="form-title">Report an Issue</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter issue title"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="form-textarea"
              rows={4}
              placeholder="Describe the issue in detail"
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input pr-10"
                placeholder="Enter issue location"
              />
              <button 
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors"
                onClick={handleUseCurrentLocation}
              >
                <MapPin className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter location manually or click the location icon to use your current location</p>
          </div>

          {/* Issue Type */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Issue Type
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
            >
              <option value="general">General Issue</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="safety">Safety</option>
              <option value="environment">Environment</option>
              <option value="water_drainage">Waterlogging & Drainage Issues</option>
              <option value="garbage">Garbage Overflow & Waste Management</option>
              <option value="road">Road Maintenance & Potholes</option>
              <option value="public_places">Unmaintained Public Places</option>
              <option value="electricity">Streetlight & Electricity Issues</option>
              <option value="water_supply">Broken Pipelines & Water Supply</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Photos */}
          <div className="form-group">
            <label className="form-label">Photos (Optional)</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-24 h-24 group">
                  <img 
                    src={photo} 
                    alt={`Uploaded ${index}`}
                    className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm transition-all duration-300 group-hover:shadow-md"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md transform transition-transform duration-300 hover:scale-110"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {photos.length === 0 && (
                <div className="w-full p-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                  <Camera className="h-10 w-10 mb-3 text-gray-400" />
                  <p>No photos added yet</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="action-button flex items-center gap-2 px-4 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="h-5 w-5 action-button-icon" />
                <span className="action-button-text">Upload Photos</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <p className="w-full text-xs text-gray-500 mt-1">Upload photos of the issue (up to 5 photos)</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="outline"
              className="action-button"
              onClick={() => navigate("/user/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || createIssueMutation.isPending}
              className="action-button bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-600"
            >
              {(loading || createIssueMutation.isPending) ? (
                <span className="flex items-center">
                  <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2 action-button-icon" />
                  <span className="action-button-text">Submit Report</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}