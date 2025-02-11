import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertIssueSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { MapPin, Upload, Loader2 } from "lucide-react";
import { useState } from "react";

const categories = [
  "Damaged Road",
  "Garbage Overflow",
  "Street Light Issue",
  "Water Supply",
  "Drainage Problem",
  "Public Property Damage",
  "Illegal Construction",
  "Tree Hazard",
  "Other",
];

export default function ReportIssue() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLocating, setIsLocating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      coordinates: null,
      category: "",
      userId: 1, // TODO: Get actual user ID
      imageUrl: "",
    },
  });

  const getLocation = async () => {
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      form.setValue("coordinates", { lat: latitude, lng: longitude });

      // Get address from coordinates using reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      form.setValue("location", data.display_name);

      toast({
        title: "Location detected",
        description: "Your location has been automatically filled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not detect location. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: any) {
    try {
      // First upload the image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
        // TODO: Implement image upload endpoint
        // const uploadRes = await fetch("/api/upload", {
        //   method: "POST",
        //   body: formData,
        // });
        // const { imageUrl } = await uploadRes.json();
        // data.imageUrl = imageUrl;
      }

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: "Issue reported successfully",
      });
      navigate("/user/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Report a Civic Issue</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief title of the issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the issue"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Location of the issue" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocation}
                          disabled={isLocating}
                        >
                          {isLocating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Photo Evidence</FormLabel>
                  <div className="grid gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 relative"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8" />
                          <span>Upload Photo</span>
                        </div>
                      )}
                    </Button>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Submit Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}