import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  bgColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = "neutral",
  bgColor = "purple"
}: StatsCardProps) {
  // Map colors to gradient classes
  const getCardClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'card-purple',
      orange: 'card-orange',
      sage: 'card-sage',
      powder: 'card-powder',
      warm: 'card-warm',
      // Handle legacy teal colors
      'teal-100': 'card-purple',
      'green-100': 'card-sage',
      'blue-100': 'card-powder',
      'amber-100': 'card-warm',
      'yellow-100': 'card-warm',
      'red-100': 'card-orange'
    };
    
    // Check if it's a class name with bg- prefix
    const cleanColor = color.replace('bg-', '');
    return colorMap[cleanColor] || 'card-purple';
  };

  const changeIcons = {
    positive: <TrendingUp className="w-4 h-4" />,
    negative: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />
  };

  const changeColors = {
    positive: "text-green-700",
    negative: "text-red-700", 
    neutral: "text-gray-600"
  };

  return (
    <div className={`${getCardClass(bgColor)} p-6 rounded-2xl shadow-soft-lg hover-lift transition-all duration-300 border border-white/20`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-soft-sm">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 ${changeColors[changeType]}`}>
            {changeIcons[changeType]}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-display font-bold mb-1">
          {value}
        </h3>
        <p className="text-sm font-medium">{title}</p>
      </div>
    </div>
  );
}