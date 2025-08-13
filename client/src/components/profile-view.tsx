import React, { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Edit3, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Target, 
  Heart,
  Volume2,
  Settings,
  Calendar,
  BookOpen
} from "lucide-react";
import ProfileEdit from "./profile-edit";

export default function ProfileView() {
  const { profile, loading, error } = useProfile();
  const [isEditing, setIsEditing] = useState(false);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Error loading profile: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profile found</h3>
            <p className="text-gray-500 mb-4">Create your profile to personalize email generation</p>
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Mock user data - in real app, this would come from auth context
  const userName = "Jessica Stone";
  const userEmail = "jessica.stone@stanford.edu";

  if (isEditing) {
    return <ProfileEdit profile={profile} onSave={() => setIsEditing(false)} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-teal-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src="/api/placeholder/80/80" alt={userName} />
                <AvatarFallback className="bg-teal-600 text-white text-xl">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
                <p className="text-gray-600 mb-2">{userEmail}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {profile.school && (
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {profile.school}
                    </div>
                  )}
                  {profile.gradYear && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Class of {profile.gradYear}
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} className="bg-teal-600 hover:bg-teal-700">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-teal-600" />
              Academic Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">School</label>
              <p className="text-gray-900 font-medium">{profile.school || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Major</label>
              <p className="text-gray-900 font-medium">{profile.major || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Graduation Year</label>
              <p className="text-gray-900 font-medium">
                {profile.gradYear ? `Class of ${profile.gradYear}` : "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <p className="text-gray-900 font-medium">{profile.location || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-teal-600" />
              Email Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center mb-2">
                <Volume2 className="w-4 h-4 mr-1" />
                Default Tone
              </label>
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                {profile.tone}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                This tone will be used by default when generating emails
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-teal-600" />
              Interests & Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No interests specified</p>
            )}
          </CardContent>
        </Card>

        {/* Career Targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-teal-600" />
              Career Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.targets && profile.targets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.targets.map((target, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {target}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No career targets specified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Impact on Email Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How This Affects Your Email Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-teal-50 rounded-lg">
              <h4 className="font-semibold text-teal-800 mb-2">Personal Context</h4>
              <p className="text-sm text-teal-700">
                Your school, major, and location help create relevant connections and shared experiences in emails.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Communication Style</h4>
              <p className="text-sm text-blue-700">
                Your preferred tone ({profile.tone}) ensures emails match your personality and communication style.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Relevant Topics</h4>
              <p className="text-sm text-purple-700">
                Your interests help identify common ground and conversation starters with connections.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Career Focus</h4>
              <p className="text-sm text-orange-700">
                Your targets help tailor emails for specific industries and career paths you're pursuing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}