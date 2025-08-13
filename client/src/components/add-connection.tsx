import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  X, 
  Plus, 
  AlertCircle,
  CheckCircle,
  User,
  Building,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  FileText
} from "lucide-react";

interface AddConnectionProps {
  open: boolean;
  onClose: () => void;
  onSave: (connection: any) => void;
}

export default function AddConnection({ open, onClose, onSave }: AddConnectionProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    location: "",
    notes: "",
    alumni: false,
    school: "",
    gradYear: "",
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.fullName.trim()) {
        setError("Full name is required");
        return;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        return;
      }

      // Clean and prepare data
      const connectionData = {
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim() || null,
        role: formData.role.trim() || null,
        location: formData.location.trim() || null,
        notes: formData.notes.trim() || null,
        school: formData.alumni && formData.school.trim() ? formData.school.trim() : null,
        gradYear: formData.alumni && formData.gradYear ? parseInt(formData.gradYear) : null,
        tags: formData.tags.filter(tag => tag.trim())
      };

      await onSave(connectionData);
      setSuccess(true);
      
      // Reset form and close after success
      setTimeout(() => {
        resetForm();
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add connection");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      company: "",
      role: "",
      location: "",
      notes: "",
      alumni: false,
      school: "",
      gradYear: "",
      tags: []
    });
    setNewTag("");
    setError(null);
  };

  const addTag = () => {
    if (newTag.trim() && !(formData.tags || []).includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index)
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-green-800 mb-2">Connection Added Successfully!</h3>
            <p className="text-green-600">The new connection has been added to your network.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Add New Connection
          </DialogTitle>
          <DialogDescription>
            Add a new professional connection to your network
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="e.g., John Smith"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., john.smith@company.com"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Professional Details
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Google"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., Software Engineer"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, CA"
                className="mt-1"
              />
            </div>
          </div>

          {/* Alumni Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="alumni"
                checked={formData.alumni}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, alumni: !!checked }))}
              />
              <Label htmlFor="alumni" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                This person is an alumni from my school
              </Label>
            </div>

            {formData.alumni && (
              <div className="grid gap-4 md:grid-cols-2 pl-6 border-l-2 border-primary/20 bg-primary/5 p-4 rounded-xl">
                <div>
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="e.g., Stanford University"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="gradYear">Graduation Year</Label>
                  <Select
                    value={formData.gradYear}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gradYear: value }))}
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
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tags & Categories
            </h3>
            
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm" disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(formData.tags || []).map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                  <button
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {(!formData.tags || formData.tags.length === 0) && (
                <p className="text-gray-500 italic text-sm">No tags added yet</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this connection..."
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Adding..." : "Add Connection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}