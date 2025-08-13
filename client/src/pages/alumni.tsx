import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Search, UserPlus, MapPin, Building, GraduationCap, Users, Loader2, CheckCircle } from "lucide-react";
import { createConnection } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ensureDevAuth } from "@/lib/devAuth";

interface Alumni {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  location: string;
  school: string;
  program: string;
  gradYear: number;
  industry: string;
  skills: string[];
  score?: number;
}

export default function Alumni() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [recommendations, setRecommendations] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // Get unique industries and locations for filters
  const industries = Array.from(new Set(alumni.map(a => a.industry))).sort();
  const locations = Array.from(new Set(alumni.map(a => a.location.split(', ')[1] || a.location))).sort();

  // Load initial data
  useEffect(() => {
    loadAlumniData();
  }, []);

  // Perform search when filters change
  useEffect(() => {
    if (searchQuery || selectedIndustry !== 'all' || selectedLocation !== 'all') {
      performSearch();
    } else {
      loadAlumniData();
    }
  }, [searchQuery, selectedIndustry, selectedLocation]);

  const loadAlumniData = async () => {
    try {
      setLoading(true);
      
      // Ensure development authentication
      const isAuthenticated = await ensureDevAuth();
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }
      
      // Load recommendations and all alumni
      const [recsResponse, alumniResponse] = await Promise.all([
        fetch('/api/alumni/recommendations', { credentials: 'include' }),
        fetch('/api/alumni?take=50', { credentials: 'include' })
      ]);
      
      if (recsResponse.ok) {
        const recsData = await recsResponse.json();
        setRecommendations(recsData);
      } else {
        console.error('Failed to load recommendations:', recsResponse.status, recsResponse.statusText);
      }
      
      if (alumniResponse.ok) {
        const alumniData = await alumniResponse.json();
        setAlumni(alumniData);
      } else {
        console.error('Failed to load alumni:', alumniResponse.status, alumniResponse.statusText);
      }
    } catch (error) {
      console.error('Failed to load alumni data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setSearchLoading(true);
      
      const params = new URLSearchParams({
        query: searchQuery,
        industry: selectedIndustry,
        location: selectedLocation,
        take: '50'
      });
      
      const response = await fetch(`/api/alumni/search?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const results = await response.json();
        setAlumni(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConnect = async (alumnus: Alumni) => {
    try {
      setConnectingIds(prev => new Set(prev).add(alumnus.id));
      
      // Ensure development authentication
      const isAuthenticated = await ensureDevAuth();
      if (!isAuthenticated) {
        throw new Error('Authentication failed');
      }
      
      const connectionData = {
        fullName: alumnus.name,
        email: alumnus.email,
        company: alumnus.company,
        role: alumnus.role,
        location: alumnus.location,
        alumni: true,
        school: alumnus.school,
        gradYear: alumnus.gradYear,
        notes: `Added from alumni directory - ${alumnus.program} graduate`,
        tags: [alumnus.industry, 'Alumni']
      };
      
      await createConnection(connectionData);
      
      setConnectedIds(prev => new Set(prev).add(alumnus.id));
      console.log('Successfully connected to:', alumnus.name);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to add connection. They may already be in your network.');
    } finally {
      setConnectingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(alumnus.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <main className="px-6 py-8 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  const getUserFirstName = () => {
    return "Student"; // In real app, would get from user context
  };

  return (
    <main className="px-6 py-8 animate-fade-in bg-gradient-to-br from-powder-100 via-powder-50 to-background min-h-screen">
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Discover amazing alumni, {getUserFirstName()}
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              connect with {alumni.length} talented alumni from Stanford University.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">{alumni.length} alumni • {recommendations.length} recommendations</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50 p-8 mb-8">
        <div className="space-y-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by name, company, role, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 w-full h-14 rounded-2xl border-border/50 focus:ring-primary text-lg"
              />
              {searchLoading && (
                <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-3">Industry</label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="h-12 rounded-2xl border-border/50">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-3">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12 rounded-2xl border-border/50">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-border/50 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Lightbulb className="w-5 h-5 text-primary" />
              Top Recommendations for You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.slice(0, 6).map((alumnus) => (
                <div key={alumnus.id} className="card-orange p-6 rounded-3xl shadow-soft-md hover-lift transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center shadow-soft-sm">
                        <span className="text-sm font-display font-bold text-foreground">
                          {alumnus.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground font-display">{alumnus.name}</h4>
                        <p className="text-sm text-gray-600">{alumnus.role}</p>
                      </div>
                    </div>
                    {alumnus.score && (
                      <div className="px-3 py-1 bg-white/50 rounded-full">
                        <span className="text-xs font-semibold text-foreground">
                          {alumnus.score} pts
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {alumnus.company}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {alumnus.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {alumnus.program} '{alumnus.gradYear.toString().slice(-2)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {alumnus.skills.slice(0, 3).map((skill, idx) => (
                      <div key={idx} className="px-2 py-1 bg-white/40 rounded-full">
                        <span className="text-xs font-medium text-foreground">{skill}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => handleConnect(alumnus)}
                    disabled={connectingIds.has(alumnus.id) || connectedIds.has(alumnus.id)}
                    variant={connectedIds.has(alumnus.id) ? "default" : "pill"}
                    className={`w-full !text-black ${connectedIds.has(alumnus.id) ? 'bg-success hover:bg-success/90' : 'bg-gradient-to-r from-primary to-primary/90'}`}
                    size="lg"
                  >
                    {connectingIds.has(alumnus.id) ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                    ) : connectedIds.has(alumnus.id) ? (
                      <><CheckCircle className="w-4 h-4 mr-2" />Added!</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" />Add as Connection</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Alumni */}
      <Card className="bg-white/70 backdrop-blur-sm border-border/50 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-display text-xl">
            <span>All Alumni ({alumni.length})</span>
            {searchLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alumni.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">No alumni found matching your search criteria</p>
              </div>
            ) : (
              alumni.map((alumnus) => (
                <div 
                  key={alumnus.id}
                  className="flex items-center justify-between p-6 bg-white/50 border border-border/30 rounded-3xl hover:bg-white/70 hover-lift transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-2xl flex items-center justify-center ring-2 ring-white">
                      <span className="text-lg font-display font-semibold text-foreground">
                        {alumnus.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground font-display text-lg">{alumnus.name}</h4>
                      <p className="text-sm text-gray-600 font-medium">{alumnus.role} at {alumnus.company}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {alumnus.program} '{alumnus.gradYear.toString().slice(-2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {alumnus.location}
                        </span>
                        <div className="px-2 py-1 bg-accent/10 rounded-full">
                          <span className="text-xs font-medium text-accent">{alumnus.industry}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {alumnus.skills.slice(0, 4).map((skill, idx) => (
                          <div key={idx} className="px-2 py-1 bg-primary/10 rounded-full">
                            <span className="text-xs font-medium !text-black">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant={connectedIds.has(alumnus.id) ? "default" : "pill"}
                      onClick={() => handleConnect(alumnus)}
                      disabled={connectingIds.has(alumnus.id) || connectedIds.has(alumnus.id)}
                      className={connectedIds.has(alumnus.id) ? "bg-success hover:bg-success/90 !text-black" : "bg-gradient-to-r from-primary to-primary/90 !text-black"}
                      size="lg"
                    >
                      {connectingIds.has(alumnus.id) ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                      ) : connectedIds.has(alumnus.id) ? (
                        <><CheckCircle className="w-4 h-4 mr-2" />Added!</>
                      ) : (
                        <><UserPlus className="w-4 h-4 mr-2" />Add as Connection</>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
