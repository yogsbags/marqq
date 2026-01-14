import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  HiChat as Bot,
  HiCurrencyDollar as DollarSign,
  HiEye as Eye,
  HiQuestionMarkCircle as HelpCircle,
  HiHome as LayoutDashboard,
  HiPencil as PenTool,
  HiSearch as Search,
  HiCog as Settings,
  HiChartBar as Target,
  HiTrendingUp as TrendingUp,
  HiUsers as Users,
  HiVideoCamera as Video
} from 'react-icons/hi';

interface SidebarProps {
  selectedModule: string | null;
  onModuleSelect: (moduleId: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navigationItems = [
  {
    id: null,
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'lead-intelligence',
    title: 'Lead Intelligence',
    icon: Target,
  },
  {
    id: 'ai-voice-bot',
    title: 'AI Voice Bot',
    icon: Bot,
  },
  {
    id: 'ai-video-bot',
    title: 'AI Video Bot',
    icon: Video,
  },
  {
    id: 'user-engagement',
    title: 'User Engagement',
    icon: Users,
  },
  {
    id: 'budget-optimization',
    title: 'Budget Optimization',
    icon: DollarSign,
  },
  {
    id: 'performance-scorecard',
    title: 'Performance Scorecard',
    icon: TrendingUp,
  },
  {
    id: 'ai-content',
    title: 'AI Content',
    icon: PenTool,
  },
  {
    id: 'seo-llmo',
    title: 'SEO/LLMO',
    icon: Search,
  },
  {
    id: 'unified-customer-view',
    title: 'Customer View',
    icon: Eye,
  }
];

const bottomItems = [
  {
    id: 'settings',
    title: 'Settings',
    icon: Settings,
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
  }
];

export function Sidebar({ selectedModule, onModuleSelect, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={cn(
      "fixed left-0 top-0 z-30 flex flex-col h-full bg-white dark:bg-gray-950 border-r transition-all duration-300",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2 flex-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 opacity-80"></div>
              <div className="relative">
                <div className="w-5 h-5 relative">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-white rounded-full opacity-90"></div>
                  <div className="absolute top-0.5 right-0 w-1.5 h-1.5 bg-white rounded-full opacity-70"></div>
                  <div className="absolute bottom-0 left-0.5 w-2 h-2 bg-white rounded-full opacity-80"></div>
                  <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white rounded-full opacity-60"></div>
                </div>
              </div>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Torqq AI
            </h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Button
              key={item.id || 'dashboard'}
              variant={selectedModule === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200 hover:scale-[1.02]",
                collapsed ? "px-2" : "px-3 py-2.5",
                selectedModule === item.id
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-transparent text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:text-gray-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 focus:outline-none focus:ring-0"
              )}
              onClick={() => onModuleSelect(item.id)}
            >
              {item.icon && (
                <item.icon className={cn(
                  "h-4 w-4",
                  collapsed ? "" : "mr-2"
                )} />
              )}
              {!collapsed && (
                <span className="font-medium text-left">{item.title}</span>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          {bottomItems.map((item) => (
            <Button
              key={item.id}
              variant={selectedModule === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200 hover:scale-[1.02]",
                collapsed ? "px-2" : "px-3 py-2.5",
                selectedModule === item.id
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-transparent text-gray-700 hover:bg-orange-50 hover:text-orange-700 dark:text-gray-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
              )}
              onClick={() => onModuleSelect(item.id)}
            >
              <item.icon className={cn(
                "h-4 w-4",
                collapsed ? "" : "mr-2"
              )} />
              {!collapsed && (
                <span className="font-medium text-left">{item.title}</span>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
