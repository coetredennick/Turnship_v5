import React, { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  BookOpen,
  Settings,
  Heart,
  Target
} from "lucide-react";
import type { Profile } from "@/lib/api";

interface ProfileEditProps {
  profile: Profile;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfileEdit({ profile: initialProfile, onSave, onCancel }: ProfileEditProps) {
  const { updateProfile } = useProfile();
  const [profile, setProfile] = useState<Partial<Profile>>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // New item inputs
  const [newInterest, setNewInterest] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Clean up empty arrays
      const cleanedProfile = {
        ...profile,
        interests: profile.interests?.filter(i => i.trim()) || [],
        targets: profile.targets?.filter(t => t.trim()) || [],
      };

      await updateProfile(cleanedProfile);
      setSuccess(true);
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests?.includes(newInterest.trim())) {
      setProfile(prev => ({
        ...prev,
        interests: [...(prev.interests || []), newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests?.filter((_, i) => i !== index) || []
    }));
  };

  const addTarget = () => {
    if (newTarget.trim() && !profile.targets?.includes(newTarget.trim())) {
      setProfile(prev => ({
        ...prev,
        targets: [...(prev.targets || []), newTarget.trim()]
      }));
      setNewTarget("");
    }
  };

  const removeTarget = (index: number) => {
    setProfile(prev => ({
      ...prev,
      targets: prev.targets?.filter((_, i) => i !== index) || []
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

  const toneOptions = [
    { value: "warm", label: "Warm & Friendly", description: "Approachable and personable" },
    { value: "professional", label: "Professional", description: "Formal and business-like" },
    { value: "casual", label: "Casual", description: "Relaxed and conversational" },
    { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and passionate" },
    { value: "respectful", label: "Respectful", description: "Polite and considerate" }
  ];

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Profile Updated Successfully!</h3>
            <p className="text-green-600">Your changes have been saved and will be used in future email generation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel} disabled={saving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
          {error && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
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
              <Label htmlFor="school">School/University</Label>
              <Input
                id="school"
                value={profile.school || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, school: e.target.value }))}
                placeholder="e.g., Stanford University"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="major">Major/Field of Study</Label>
              <Input
                id="major"
                value={profile.major || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, major: e.target.value }))}
                placeholder="e.g., Computer Science"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="gradYear">Graduation Year</Label>
              <Select
                value={profile.gradYear?.toString() || ""}
                onValueChange={(value) => setProfile(prev => ({ ...prev, gradYear: parseInt(value) }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profile.location || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco Bay Area"
                className="mt-1"
              />
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
              <Label>Default Email Tone</Label>
              <Select
                value={profile.tone || "warm"}
                onValueChange={(value) => setProfile(prev => ({ ...prev, tone: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                This will be your default tone when generating emails, but you can always customize it per email.
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
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Add your interests and skills to help create more personalized and relevant emails.
            </p>
            
            <div className="flex space-x-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                onKeyDown={(e) => e.key === 'Enter' && addInterest()}
              />
              <Button onClick={addInterest} size="sm" disabled={!newInterest.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.interests?.map((interest, index) => (
                <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {interest}
                  <button
                    onClick={() => removeInterest(index)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )) || <p className="text-gray-500 italic">No interests added yet</p>}
            </div>
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
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Specify the types of companies or industries you're targeting for better email personalization.
            </p>
            
            <div className="flex space-x-2">
              <Input
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="Add a career target..."
                onKeyDown={(e) => e.key === 'Enter' && addTarget()}
              />
              <Button onClick={addTarget} size="sm" disabled={!newTarget.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.targets?.map((target, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {target}
                  <button
                    onClick={() => removeTarget(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )) || <p className="text-gray-500 italic">No career targets added yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Preview: How This Will Improve Your Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Example Email Enhancement:</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Without Profile:</p>
                <p className="text-sm text-gray-600 italic">
                  "Hi [Name], I'm a student interested in your work..."
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">With Your Profile:</p>
                <p className="text-sm text-gray-600 italic">
                  "Hi [Name], As a {profile.major || 'CS'} student at {profile.school || 'Stanford'} interested in {profile.interests?.[0] || 'technology'}, I was excited to see your work at [Company]..."
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Your profile will help generate emails that:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Include relevant personal context and shared experiences</li>
              <li>Match your preferred communication style</li>
              <li>Highlight relevant interests and skills</li>
              <li>Focus on your target industries and career goals</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}