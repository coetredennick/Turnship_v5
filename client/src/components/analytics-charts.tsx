import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AnalyticsData } from "@/hooks/useAnalytics";

const emailActivityData = [
  { day: "Mon", emails: 0 },
  { day: "Tue", emails: 0 },
  { day: "Wed", emails: 0 },
  { day: "Thu", emails: 0 },
  { day: "Fri", emails: 0 },
  { day: "Sat", emails: 0 },
  { day: "Sun", emails: 0 },
];

const COLORS = ["#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"];

export function EmailActivityChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Email Activity</h3>
        <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
          <option>Last 30 days</option>
          <option>Last 3 months</option>
          <option>Last year</option>
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={emailActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Bar dataKey="emails" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StateFunnelChartProps {
  analytics?: AnalyticsData | null;
  loading?: boolean;
}

export function StateFunnelChart({ analytics, loading }: StateFunnelChartProps) {
  // Create state data from analytics
  const stateData = analytics?.stateFunnel ? Object.entries(analytics.stateFunnel).map(([state, count]) => ({
    state,
    count,
    percentage: Math.round((count / Math.max(...Object.values(analytics.stateFunnel))) * 100)
  })) : [
    { state: "NOT_CONTACTED", count: 0, percentage: 0 },
    { state: "DRAFTING", count: 0, percentage: 0 },
    { state: "SENT", count: 0, percentage: 0 },
    { state: "AWAITING_REPLY", count: 0, percentage: 0 },
    { state: "REPLIED", count: 0, percentage: 0 },
    { state: "CLOSED", count: 0, percentage: 0 }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Connection State Funnel</h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Connection State Funnel</h3>
      <div className="space-y-4">
        {stateData.map((state, index) => (
          <div key={state.state} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 capitalize">{state.state.toLowerCase().replace(/_/g, ' ')}</span>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${state.percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length] 
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">{state.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceInsights() {
  const insights = [
    {
      title: "Email Activity",
      description: "No email activity yet - start your outreach!",
      color: "green",
      icon: "📧"
    },
    {
      title: "Response Time", 
      description: "No responses to track yet",
      color: "blue",
      icon: "⏰"
    },
    {
      title: "Connection Growth",
      description: "Build your network with quality connections",
      color: "purple",
      icon: "📈"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insights.map((insight, index) => (
        <div 
          key={index}
          className={`text-center p-4 rounded-lg border ${
            insight.color === "green" ? "bg-green-50 border-green-200" :
            insight.color === "blue" ? "bg-blue-50 border-blue-200" :
            "bg-purple-50 border-purple-200"
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
            insight.color === "green" ? "bg-green-500" :
            insight.color === "blue" ? "bg-blue-500" :
            "bg-purple-500"
          }`}>
            <span className="text-xl">{insight.icon}</span>
          </div>
          <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-600">{insight.description}</p>
        </div>
      ))}
    </div>
  );
}