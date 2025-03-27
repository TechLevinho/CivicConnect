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
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

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
  const [locationOptions, setLocationOptions] = useState<Array<{
    value: string;
    label: string;
    coordinates: { lat: number; lng: number };
  }>>([]);
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      coordinates: { lat: 0, lng: 0 },
      category: "",
      userId: 1,
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

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`
      );
      const mainLocation = await response.json();

      const nearbyResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${mainLocation.display_name}&format=json&limit=5`
      );
      const nearbyLocations = await nearbyResponse.json();

      setLocationOptions(nearbyLocations.map((loc: any) => ({
        value: loc.display_name,
        label: loc.display_name,
        coordinates: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) }
      })));

      form.setValue("location", mainLocation.display_name);

      toast({
        title: "Locations found",
        description: "Please select the correct address from the list or enter manually.",
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
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Location</FormLabel>
                      <div className="flex gap-2">
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between w-full",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? locationOptions.find((option) => option.value === field.value)?.label
                                  : "Select location..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search location..." />
                              <CommandEmpty>No location found.</CommandEmpty>
                              <CommandGroup>
                                {locationOptions.map((option) => (
                                  <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                      form.setValue("location", option.value);
                                      form.setValue("coordinates", option.coordinates);
                                      setOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === option.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {option.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocation}
                          disabled={isLocating}
                          className="shrink-0"
                        >
                          {isLocating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                      {locationOptions.length === 0 && (
                        <FormControl>
                          <Input
                            placeholder="Or enter location manually"
                            {...field}
                            className="mt-2"
                          />
                        </FormControl>
                      )}
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Photo Evidence</FormLabel>
                  <div className="grid gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-64 relative"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {imagePreview ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/5 rounded-lg" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-12 w-12 text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload a photo of the issue</span>
                          <span className="text-xs text-gray-400">
                            Supported formats: JPG, PNG
                          </span>
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