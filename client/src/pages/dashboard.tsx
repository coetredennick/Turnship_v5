import StatsCard from "@/components/stats-card";
import ActivityTimeline from "@/components/activity-timeline";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Clock, Users, Plus, UserPlus, Upload, ArrowRight, AlertTriangle } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useConnections } from "@/hooks/useConnections";
import { useFollowups } from "@/hooks/useFollowups";

export default function Dashboard() {
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const { connections, loading: connectionsLoading } = useConnections();
  const { followups, loading: followupsLoading, markAsCompleted } = useFollowups();

  const getFollowupStyles = (urgency: string, status: string) => {
    switch (urgency) {
      case 'high':
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-600",
          borderColor: "bg-red-50 border-red-200",
          buttonColor: "bg-red-600 hover:bg-red-700"
        };
      case 'medium':
        return {
          bgColor: "bg-amber-100",
          textColor: "text-amber-600",
          borderColor: "bg-amber-50 border-amber-200",
          buttonColor: "bg-amber-600 hover:bg-amber-700"
        };
      default:
        return {
          bgColor: "bg-blue-100",
          textColor: "text-blue-600",
          borderColor: "bg-blue-50 border-blue-200",
          buttonColor: "bg-blue-600 hover:bg-blue-700"
        };
    }
  };

  const handleFollowUpComplete = async (followupId: string) => {
    try {
      await markAsCompleted(followupId);
    } catch (error) {
      console.error('Failed to mark follow-up as completed:', error);
      alert('Failed to mark follow-up as completed. Please try again.');
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserFirstName = () => {
    return "Student"; // In real app, would get from user context
  };

  return (
    <main className="px-6 py-8 animate-fade-in bg-gradient-to-br from-orange-100 via-orange-50 to-background min-h-screen">
      {/* Warm Header with Personality */}
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          {getTimeOfDayGreeting()} {getUserFirstName()},
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          you can manage your networking journey from here.
        </p>
      </div>

      {/* Colorful Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <div className="card-orange p-6 rounded-3xl shadow-soft-lg hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm text-primary font-medium">This Week</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">
            {analyticsLoading ? "--" : analytics?.sendsLast7?.toString() || "0"}
          </h3>
          <p className="text-sm text-gray-600">Emails Sent</p>
        </div>

        <div className="card-sage p-6 rounded-3xl shadow-soft-lg hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-sm text-secondary font-medium">Overall</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">
            {analyticsLoading ? "--" : `${analytics?.replyRate || 0}%`}
          </h3>
          <p className="text-sm text-gray-600">Reply Rate</p>
        </div>

        <div className="card-powder p-6 rounded-3xl shadow-soft-lg hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <span className="text-sm text-accent font-medium">Due Soon</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">
            {analyticsLoading ? "--" : analytics?.followupsOverdue?.toString() || "0"}
          </h3>
          <p className="text-sm text-gray-600">Follow-ups</p>
        </div>

        <div className="card-warm p-6 rounded-3xl shadow-soft-lg hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-foreground" />
            </div>
            <span className="text-sm text-gray-600 font-medium">Active</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-1">
            {analyticsLoading ? "--" : analytics?.activeConnections?.toString() || "0"}
          </h3>
          <p className="text-sm text-gray-600">Connections</p>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50 p-8">
          <h3 className="text-xl font-display font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="space-y-4">
            <Button
              variant="pill"
              size="lg"
              className="w-full justify-between p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:scale-105 transition-transform h-auto shadow-lg"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">Start An Instant Email</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-between p-5 hover:bg-muted/50 h-auto rounded-2xl"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 bg-secondary/20 rounded-xl flex items-center justify-center mr-4">
                  <UserPlus className="w-5 h-5 text-secondary" />
                </div>
                <span className="font-medium text-foreground">Add New Contact</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-between p-5 hover:bg-muted/50 h-auto rounded-2xl"
            >
              <div className="flex items-center">
                <div className="w-9 h-9 bg-accent/20 rounded-xl flex items-center justify-center mr-4">
                  <Upload className="w-5 h-5 text-accent" />
                </div>
                <span className="font-medium text-foreground">Import Contacts</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50 p-8">
          <h3 className="text-xl font-display font-semibold text-foreground mb-6">Recent Activity</h3>
          <ActivityTimeline />
        </div>
      </div>

      {/* Due Follow-ups */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold text-foreground">Due Follow-ups</h3>
          {followups.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 rounded-full">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning font-medium">{followups.length} need{followups.length === 1 ? 's' : ''} attention</span>
            </div>
          )}
        </div>
        
        {followupsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : followups.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
            <p className="text-foreground font-semibold font-display text-lg mb-1">All caught up!</p>
            <p className="text-sm text-gray-600">No follow-ups are due at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {followups.map((followup) => {
              const styles = getFollowupStyles(followup.urgency || 'low', followup.status);
              const initials = followup.connection?.fullName?.split(' ').map(n => n[0]).join('') || 'N/A';
              
              return (
                <div 
                  key={followup.id}
                  className="flex items-center justify-between p-5 bg-white/50 rounded-2xl border border-border/30 hover:bg-white/70 transition-all duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center ring-2 ring-white">
                      <span className="text-sm font-semibold text-foreground font-display">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground font-display">{followup.connection?.fullName || 'Unknown'}</h4>
                      <p className="text-sm text-gray-600">
                        {followup.connection?.role ? `${followup.connection.role} at ${followup.connection.company}` : followup.connection?.company} • {followup.timeAgo}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="pill"
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/80"
                    onClick={() => handleFollowUpComplete(followup.id)}
                  >
                    Mark Done
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}