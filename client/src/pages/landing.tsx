import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  MapPin, 
  AlertCircle, 
  Users, 
  Trophy, 
  Bell, 
  MessageSquare,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Location-Based Issues",
      description: "Report and track issues in your neighborhood with precise location mapping."
    },
    {
      icon: <AlertCircle className="h-8 w-8 text-primary" />,
      title: "Real-Time Updates",
      description: "Get instant notifications when your reported issues are updated or resolved."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Community Engagement",
      description: "Connect with your community, discuss issues, and share solutions."
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Gamification",
      description: "Earn points and badges for contributing to your community."
    }
  ];

  const stats = [
    { label: "Active Issues", value: "1,234", icon: <AlertCircle className="h-6 w-6" /> },
    { label: "Resolved Issues", value: "856", icon: <CheckCircle2 className="h-6 w-6" /> },
    { label: "Community Members", value: "5,678", icon: <Users className="h-6 w-6" /> },
    { label: "Response Time", value: "< 24h", icon: <Clock className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">
              Building Better Communities Together
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Report, track, and resolve civic issues in your neighborhood. Join thousands of active citizens making their communities better.
            </p>
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate("/auth/register")}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/community-feed")}
              >
                View Issues
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {stat.icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose CivicConnect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">1. Report an Issue</h3>
                <p className="text-gray-600 text-center">
                  Take a photo and describe the issue in your neighborhood
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">2. Track Progress</h3>
                <p className="text-gray-600 text-center">
                  Follow the status updates and community responses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">3. See Results</h3>
                <p className="text-gray-600 text-center">
                  Watch your community improve through collective action
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of active citizens who are making their communities better every day.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate("/auth/register")}
          >
            Start Contributing Today
          </Button>
        </div>
      </section>
    </div>
  );
} 