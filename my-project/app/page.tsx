"use client";
import { useEffect, useState } from "react";
import { Button } from "../app/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../app/components/card"
import { Badge } from "../app/components/badge"
import RoleSelector from "./components/RoleSelector"; // adjust path if needed
import {
  Users,
  BarChart3,
  MessageSquare,
  Download,
  Trophy,
  Play,
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "../lib/supabaseClient"



export default function LandingPage() {
  function handleSignIn() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
      const fetchUserAndRole = async () => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user as any); // or type User if you have the type imported
          // Check if user has a role
          const { data: userRow } = await supabase
            .from("users")
            .select("role")
          .eq("id", data.user.id)
          .single();
        setRole(userRow?.role ?? null);
      }
      setChecking(false);
    };

    fetchUserAndRole();
  }, []);

  if (checking) return <div>Loading...</div>;
  if (user && !role)
    return (
      <RoleSelector
        user={user}
        onRoleSet={(role: "organizer" | "participant") => {
          setRole(role as any);
          // Check for redirect after role is set
          const redirectPath = localStorage.getItem("postSignInRedirect");
          if (redirectPath) {
            localStorage.removeItem("postSignInRedirect");
            window.location.href = redirectPath; // Use window.location for immediate redirect
          }
        }}
      />
    );
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EngageAI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                How it Works
              </Link>
              <Link href="#dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                Book a Demo
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-3xl"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border-blue-500/30">
                  Real-time Analytics
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                  Track Event
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}
                    Engagement
                  </span>
                  <br />
                  in Real-Time
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Boost attendee participation with intelligent engagement scoring. Perfect for hackathons, conferences,
                  and tech events.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/organizer">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Tracking
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-3 bg-transparent"
                >
                  Book a Demo
                </Button>
              </div>
              <div className="flex items-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No setup required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Real-time updates</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Live Engagement</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Live</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                      <MessageSquare className="w-6 h-6 text-blue-400 mb-2" />
                      <div className="text-2xl font-bold text-white">847</div>
                      <div className="text-blue-300 text-sm">Q&A Responses</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                      <BarChart3 className="w-6 h-6 text-purple-400 mb-2" />
                      <div className="text-2xl font-bold text-white">92%</div>
                      <div className="text-purple-300 text-sm">Poll Participation</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-4 border border-green-500/30">
                      <Download className="w-6 h-6 text-green-400 mb-2" />
                      <div className="text-2xl font-bold text-white">1.2k</div>
                      <div className="text-green-300 text-sm">Downloads</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg p-4 border border-orange-500/30">
                      <Trophy className="w-6 h-6 text-orange-400 mb-2" />
                      <div className="text-2xl font-bold text-white">8.7</div>
                      <div className="text-orange-300 text-sm">Avg Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comprehensive Engagement Tracking</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Monitor every aspect of attendee participation with our intelligent tracking system
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Attendance Tracking",
                description: "Real-time check-ins and session attendance monitoring with automated alerts",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: BarChart3,
                title: "Poll Participation",
                description: "Interactive polls with instant results and engagement analytics",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: MessageSquare,
                title: "Q&A Involvement",
                description: "Track questions, answers, and audience interaction levels",
                gradient: "from-green-500 to-emerald-500",
              },
              {
                icon: Download,
                title: "Resource Downloads",
                description: "Monitor resource engagement and content popularity metrics",
                gradient: "from-orange-500 to-red-500",
              },
              {
                icon: Trophy,
                title: "Engagement Score",
                description: "AI-powered scoring system that ranks attendee participation",
                gradient: "from-yellow-500 to-orange-500",
              },
              {
                icon: TrendingUp,
                title: "Analytics Dashboard",
                description: "Comprehensive insights with exportable reports and trends",
                gradient: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="backdrop-blur-md bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Powerful Analytics Dashboard</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get actionable insights with our intuitive dashboard designed for event organizers
            </p>
          </div>
          <div className="relative max-w-6xl mx-auto">
            <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Event Overview</h3>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Live Event</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
                      <div className="text-2xl font-bold text-white">2,847</div>
                      <div className="text-blue-300 text-sm">Total Attendees</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/20">
                      <div className="text-2xl font-bold text-white">89%</div>
                      <div className="text-purple-300 text-sm">Engagement Rate</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
                      <div className="text-2xl font-bold text-white">1,234</div>
                      <div className="text-green-300 text-sm">Active Now</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/20">
                      <div className="text-2xl font-bold text-white">7.8</div>
                      <div className="text-orange-300 text-sm">Avg Score</div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h4 className="text-white font-medium mb-4">Engagement Timeline</h4>
                    <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg flex items-end justify-center">
                      <div className="text-white/60 text-sm">Interactive Chart Placeholder</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Top Participants</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Alex Chen", score: 9.8, badge: "🏆" },
                      { name: "Sarah Kim", score: 9.5, badge: "🥈" },
                      { name: "Mike Johnson", score: 9.2, badge: "🥉" },
                      { name: "Emma Davis", score: 8.9, badge: "" },
                      { name: "David Wilson", score: 8.7, badge: "" },
                    ].map((participant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="text-white text-sm">{participant.name}</span>
                          {participant.badge && <span className="text-lg">{participant.badge}</span>}
                        </div>
                        <div className="text-white font-medium">{participant.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 opacity-30"></div>

              {[
                {
                  step: "01",
                  title: "Create Event",
                  description: "Set up your event profile with basic details and engagement goals",
                  icon: Calendar,
                },
                {
                  step: "02",
                  title: "Configure Tracking",
                  description: "Choose which engagement metrics to track and set scoring parameters",
                  icon: Target,
                },
                {
                  step: "03",
                  title: "Launch & Monitor",
                  description: "Start your event and watch real-time engagement data flow in",
                  icon: Play,
                },
                {
                  step: "04",
                  title: "Analyze Results",
                  description: "Review comprehensive analytics and export detailed reports",
                  icon: BarChart3,
                },
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-6 text-center hover:bg-white/10 transition-all duration-300 group">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Events?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of event organizers who are already boosting engagement with EngageTrack
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
              >
                Schedule Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">EngageAI</span>
              </div>
              <p className="text-gray-400 text-sm">
                The ultimate event engagement tracking platform for modern organizers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Features
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Pricing
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  API
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  About
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Blog
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Careers
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Help Center
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Contact
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors block">
                  Status
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 EngageAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
