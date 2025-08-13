import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, MapPin, Briefcase } from "lucide-react";

interface AlumniMember {
  id: string;
  name: string;
  role: string;
  company: string;
  school: string;
  graduationYear: string;
  location: string;
  matchScore: number;
  isRecommended?: boolean;
  reasons?: string[];
}

interface AlumniGridProps {
  alumni: AlumniMember[];
  onConnect: (alumniId: string) => void;
}

export default function AlumniGrid({ alumni, onConnect }: AlumniGridProps) {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {alumni.map((alumnus) => (
        <div 
          key={alumnus.id}
          className={`bg-white rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 border ${
            alumnus.isRecommended 
              ? "border-purple-200 bg-gradient-to-br from-purple-50 to-white" 
              : "border-gray-200"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              alumnus.isRecommended 
                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white" 
                : "bg-gray-100 text-gray-700"
            }`}>
              <span className="text-lg font-bold font-display">
                {getInitials(alumnus.name)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {alumnus.isRecommended && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
              <span className={`text-sm font-semibold ${
                alumnus.isRecommended ? "text-purple-700" : "text-gray-600"
              }`}>
                {alumnus.matchScore}% Match
              </span>
            </div>
          </div>
          
          <h4 className="font-semibold text-gray-900 text-lg mb-1">{alumnus.name}</h4>
          
          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="w-3 h-3" />
              <span>{alumnus.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-3 h-3" />
              <span>{alumnus.company}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{alumnus.location}</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mb-3">
            {alumnus.school} • Class of {alumnus.graduationYear}
          </p>
          
          {alumnus.reasons && alumnus.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {alumnus.reasons.map((reason, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
          
          <Button 
            className={`w-full ${
              alumnus.isRecommended 
                ? "" 
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            onClick={() => onConnect(alumnus.id)}
            variant={alumnus.isRecommended ? "default" : "secondary"}
          >
            Connect
          </Button>
        </div>
      ))}
    </div>
  );
}