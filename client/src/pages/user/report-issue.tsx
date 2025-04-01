import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import "../../styles/main.css";
import { Upload, X, MapPin } from "lucide-react";

export default function ReportIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    type: "general"
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newIssue = {
        id: Date.now(),
        ...formData,
        photos: photos,
        status: "open",
        createdAt: new Date().toISOString(),
        userId: "current-user"
      };

      const existingIssues = JSON.parse(localStorage.getItem("issues") || "[]");
      const updatedIssues = [...existingIssues, newIssue];
      localStorage.setItem("issues", JSON.stringify(updatedIssues));

      toast({
        title: "Success",
        description: "Issue reported successfully!",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        type: "general"
      });
      setPhotos([]);

      navigate("/user/dashboard");
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast({
        title: "Error",
        description: "Failed to report issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">Report an Issue</h2>
        
        <form onSubmit={handleSubmit}>
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                onClick={handleUseCurrentLocation}
              >
                <MapPin className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Enter location manually or click the location icon to use your current location</p>
          </div>

          {/* Issue Type */}
          <div className="form-group">
            <label htmlFor="type" className="form-label">
              Issue Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select"
            >
              <option value="general">General Issue</option>
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
                <div key={index} className="relative w-24 h-24">
                  <img 
                    src={photo} 
                    alt={`Uploaded ${index}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5" />
                <span>Upload Photos</span>
              </button>
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
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/user/dashboard")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}