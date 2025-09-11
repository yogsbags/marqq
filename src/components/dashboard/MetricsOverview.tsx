import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react';

interface OverallMetrics {
  totalLeads: number;
  conversionRate: number;
  roiImprovement: number;
  activeUsers: number;
}

interface MetricsOverviewProps {
  metrics: OverallMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const metricCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      description: 'Leads processed this month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Conversion Rate',
      value: metrics.conversionRate,
      description: 'Average across all campaigns',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      suffix: '%',
    },
    {
      title: 'ROI Improvement',
      value: metrics.roiImprovement,
      description: 'Compared to last quarter',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      prefix: '+',
      suffix: '%',
    },
    {
      title: 'Active Users',
      value: metrics.activeUsers,
      description: 'Monthly active users',
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric, index) => (
        <Card 
          key={metric.title} 
          className="transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-50 slide-in-from-bottom-5"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-full ${metric.bgColor} flex items-center justify-center`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter
                value={metric.value}
                prefix={metric.prefix}
                suffix={metric.suffix}
                duration={1500}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}