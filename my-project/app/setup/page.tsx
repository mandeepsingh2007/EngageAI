"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { useToast } from "@/app/hooks/use-toast"
import {
  Plus,
  Trash2,
  Copy,
  Zap,
  Clock,
  Users,
  BarChart3,
  MessageSquare,
  Download,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient";

interface Session {
  id: string
  name: string
}

interface Activity {
  id: string
  type: "poll" | "resource" | "qa"
  title: string
}

interface GeneratedLink {
  session: string
  url: string
}

export default function EventSetupPage() {
  const [eventName, setEventName] = useState("")
  const [sessions, setSessions] = useState<Session[]>([{ id: "1", name: "" }])
  const [activities, setActivities] = useState<Activity[]>([])
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const { toast } = useToast()

  const addSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: "",
    }
    setSessions([...sessions, newSession])
  }

  const removeSession = (id: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((session) => session.id !== id))
    }
  }

  const updateSession = (id: string, name: string) => {
    setSessions(sessions.map((session) => (session.id === id ? { ...session, name } : session)))
  }

  const addActivity = (type: "poll" | "resource" | "qa") => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type,
      title: "",
    }
    setActivities([...activities, newActivity])
  }

  const removeActivity = (id: string) => {
    setActivities(activities.filter((activity) => activity.id !== id))
  }

  const updateActivity = (id: string, title: string) => {
    setActivities(activities.map((activity) => (activity.id === id ? { ...activity, title } : activity)))
  }

  const generateLinks = async () => {
    if (!eventName.trim()) {
      toast("Please enter an event name to generate tracking links.");
      return;
    }
    const validSessions = sessions.filter((session) => session.name.trim());
    if (validSessions.length === 0) {
      toast("Please add at least one session to generate tracking links.");
      return;
    }
    setIsGenerating(true);
    // 1. Insert event
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast("You must be signed in as an organizer to create an event.");
      setIsGenerating(false);
      return;
    }
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({ name: eventName, organizer_id: user.id })
      .select()
      .single();
    if (eventError || !eventData) {
      toast(eventError?.message || "Event creation failed.");
      setIsGenerating(false);
      return;
    }
    // 2. Insert sessions
    const sessionInserts = validSessions.map((session) => ({
      name: session.name,
      event_id: eventData.id,
    }));
    const { data: sessionRows, error: sessionError } = await supabase
      .from("sessions")
      .insert(sessionInserts)
      .select();
    if (sessionError || !sessionRows) {
      toast(sessionError?.message || "Session creation failed.");
      setIsGenerating(false);
      return;
    }
    // 3. Insert activities (if any)
    if (activities.length > 0) {
      const activityInserts = activities.map((activity) => ({
        session_id: sessionRows[0].id, // You may want to map activities to sessions if needed
        type: activity.type,
        title: activity.title,
        data: {},
      }));
      const { error: activityError } = await supabase
        .from("activities")
        .insert(activityInserts);
      if (activityError) {
        toast(activityError.message);
        setIsGenerating(false);
        return;
      }
    }
    // 4. Prepare session IDs for QR code generation
    setGeneratedLinks(
      sessionRows.map((session) => ({
        session: session.name,
        url: session.id, // We'll use session.id for QR code
      }))
    );
    setShowLinks(true);
    setIsGenerating(false);
    toast("Your event and sessions are now live. QR codes are ready to share.");
  };

  const copyToClipboard = async (text: string, sessionName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${sessionName} tracking link copied to clipboard.`)
    } catch (err) {
      toast("Please copy the link manually.")
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "poll":
        return BarChart3
      case "resource":
        return Download
      case "qa":
        return MessageSquare
      default:
        return Plus
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "poll":
        return "from-purple-500 to-pink-500"
      case "resource":
        return "from-green-500 to-emerald-500"
      case "qa":
        return "from-blue-500 to-cyan-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">EngageAI</span>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border-blue-500/30 px-4 py-1">
              Quick Setup
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Set Up Your Event in
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}
              60 Seconds
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create tracking links for your sessions and start monitoring engagement instantly
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Event Setup Form */}
          <Card className="backdrop-blur-md bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Users className="w-6 h-6 text-blue-400" />
                <span>Event Configuration</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Configure your event details and sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-white font-medium">
                  Event Name
                </Label>
                <Input
                  id="eventName"
                  placeholder="e.g., AI & Machine Learning Conference 2025"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              {/* Sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-medium">Sessions</Label>
                  <Button
                    onClick={addSession}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Session
                  </Button>
                </div>
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="flex items-center space-x-3 group">
                      <div className="flex-1">
                        <Input
                          placeholder={`Session ${index + 1} (e.g., AI Workshop, Keynote Speech)`}
                          value={session.name}
                          onChange={(e) => updateSession(session.id, e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                      </div>
                      {sessions.length > 1 && (
                        <Button
                          onClick={() => removeSession(session.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-medium">Activities (Optional)</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => addActivity("poll")}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Poll
                    </Button>
                    <Button
                      onClick={() => addActivity("resource")}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Resource
                    </Button>
                    <Button
                      onClick={() => addActivity("qa")}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Q&A
                    </Button>
                  </div>
                </div>
                {activities.length > 0 && (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const IconComponent = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex items-center space-x-3 group">
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <Input
                              placeholder={`${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} title`}
                              value={activity.title}
                              onChange={(e) => updateActivity(activity.id, e.target.value)}
                              className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                            />
                          </div>
                          <Button
                            onClick={() => removeActivity(activity.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <Button
                  onClick={generateLinks}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Links...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate Tracking Links
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Links */}
          {showLinks && (
            <Card className="backdrop-blur-md bg-white/5 border-white/10 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ExternalLink className="w-6 h-6 text-green-400" />
                  <span>Generated Tracking Links</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Share these links with your attendees to start tracking engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedLinks.map((link, index) => (
                  <div
                    key={index}
                    className="group bg-black/20 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">{link.session}</div>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")}/join/${link.url}`}
                          alt="QR Code"
                        />
                      </div>
                      <Button
                        onClick={() => copyToClipboard(link.url, link.session)}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-4"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Call to Action */}
                <div className="mt-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div>
                      <div className="text-white font-medium mb-1">Ready to engage?</div>
                      <div className="text-green-300 text-sm">
                        Share these links with your attendees now and start tracking their engagement in real-time.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
