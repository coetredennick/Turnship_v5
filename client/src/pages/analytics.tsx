import StatsCard from "@/components/stats-card";
import { EmailActivityChart, StateFunnelChart, PerformanceInsights } from "@/components/analytics-charts";
import { Mail, CheckCircle, Clock, Timer, Users } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function Analytics() {
  const { analytics, loading } = useAnalytics();
  
  const getUserFirstName = () => {
    return "Student"; // In real app, would get from user context
  };

  return (
    <main className="px-6 py-8 animate-fade-in bg-gradient-to-br from-sage-50 via-orange-50 to-powder-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">
          Here's how you're doing, {getUserFirstName()}
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          track your outreach performance and see what's working best.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Emails Sent (7d)"
          value={loading ? "--" : analytics?.sendsLast7?.toString() || "0"}
          icon={<Mail className="w-6 h-6 text-teal-600" />}
          change={loading ? "--" : `${analytics?.sendsLast28 || 0} in 28d`}
          changeType="positive"
          bgColor="bg-teal-100"
        />
        <StatsCard
          title="Reply Rate"
          value={loading ? "--" : `${analytics?.replyRate || 0}%`}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          change={loading ? "--" : `${analytics?.totalReplies || 0} replies`}
          changeType="positive"
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Positive Replies"
          value={loading ? "--" : analytics?.positiveReplies?.toString() || "0"}
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          change={loading ? "--" : `${analytics?.positiveReplyRate || 0}% of replies`}
          changeType="positive"
          bgColor="bg-emerald-100"
        />
        <StatsCard
          title="Active Connections"
          value={loading ? "--" : analytics?.activeConnections?.toString() || "0"}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          change={loading ? "--" : `${analytics?.followupsOverdue || 0} overdue`}
          changeType={analytics?.followupsOverdue ? "negative" : "positive"}
          bgColor="bg-blue-100"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50">
          <EmailActivityChart />
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50">
          <StateFunnelChart analytics={analytics} loading={loading} />
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-soft-lg border border-border/50 p-8">
        <h3 className="text-xl font-display font-semibold text-foreground mb-6">Performance Insights</h3>
        <PerformanceInsights />
      </div>
    </main>
  );
}