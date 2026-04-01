import { useState } from 'react';
import { TrendingUp, CheckSquare, BookOpen, Users, TrendingDown, Minus, ExternalLink, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const TABS = [
  { id: 'metrics', label: 'Metrics', icon: TrendingUp },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'brand', label: 'Brand KB', icon: BookOpen },
  { id: 'agents', label: 'Agents', icon: Users },
] as const;

type TabId = typeof TABS[number]['id'];

const MOCK_METRICS = [
  { label: 'Organic Traffic', value: '14,280', change: '+12%', positive: true },
  { label: 'Leads Generated', value: '382', change: '+8%', positive: true },
  { label: 'Conversion Rate', value: '2.7%', change: '-0.3%', positive: false },
  { label: 'Email Open Rate', value: '28.4%', change: '+4%', positive: true },
  { label: 'Avg. Session', value: '3m 12s', change: '+0%', positive: null },
  { label: 'Bounce Rate', value: '41%', change: '-2%', positive: true },
];

const MOCK_TASKS = [
  { id: '1', label: 'Review Q2 campaign brief', done: false, priority: 'high' },
  { id: '2', label: 'Publish 3 LinkedIn posts', done: false, priority: 'medium' },
  { id: '3', label: 'Connect Google Analytics', done: false, priority: 'high' },
  { id: '4', label: 'Update ICP document', done: true, priority: 'low' },
  { id: '5', label: 'Run SEO gap analysis', done: true, priority: 'medium' },
];

const MOCK_BRAND_FILES = [
  { name: 'brand_guidelines.md', size: '12 KB', updated: '2d ago' },
  { name: 'business_profile.md', size: '8 KB', updated: '2d ago' },
  { name: 'icp_document.md', size: '5 KB', updated: '5d ago' },
  { name: 'messaging_framework.md', size: '9 KB', updated: '1w ago' },
];

const MOCK_AGENTS = [
  { name: 'Veena', role: 'Marketing OS', status: 'online', color: 'bg-orange-500' },
  { name: 'Maya', role: 'SEO & LLMO', status: 'online', color: 'bg-green-500' },
  { name: 'Arjun', role: 'Lead Intel', status: 'idle', color: 'bg-blue-500' },
  { name: 'Riya', role: 'Content', status: 'working', color: 'bg-purple-500' },
  { name: 'Zara', role: 'Campaigns', status: 'idle', color: 'bg-pink-500' },
  { name: 'Dev', role: 'Analytics', status: 'idle', color: 'bg-amber-500' },
];

function MetricsTab() {
  return (
    <div className="p-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-3">Last 30 days</p>
      {MOCK_METRICS.map(m => (
        <div key={m.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">{m.label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{m.value}</span>
            <span className={cn('text-[10px] font-medium flex items-center gap-0.5',
              m.positive === true ? 'text-green-600 dark:text-green-400' :
              m.positive === false ? 'text-red-500 dark:text-red-400' :
              'text-muted-foreground'
            )}>
              {m.positive === true && <TrendingUp className="h-2.5 w-2.5" />}
              {m.positive === false && <TrendingDown className="h-2.5 w-2.5" />}
              {m.positive === null && <Minus className="h-2.5 w-2.5" />}
              {m.change}
            </span>
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center pt-2">Connect GA4 for live data</p>
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);
  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">{pending.length} pending</p>
      {pending.map(t => (
        <button key={t.id} onClick={() => setTasks(prev => prev.map(x => x.id === t.id ? { ...x, done: true } : x))}
          className="flex items-start gap-2 w-full rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors text-left group">
          <div className={cn('mt-0.5 h-4 w-4 rounded border-2 flex-shrink-0 transition-colors',
            t.priority === 'high' ? 'border-orange-400' : t.priority === 'medium' ? 'border-blue-400' : 'border-border group-hover:border-muted-foreground'
          )} />
          <span className="text-xs text-foreground leading-relaxed">{t.label}</span>
        </button>
      ))}
      {done.length > 0 && (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mt-3 mb-1">{done.length} completed</p>
          {done.map(t => (
            <div key={t.id} className="flex items-start gap-2 px-2 py-2 opacity-50">
              <div className="mt-0.5 h-4 w-4 rounded border-2 border-green-500 bg-green-500 flex-shrink-0 flex items-center justify-center">
                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-xs text-muted-foreground line-through leading-relaxed">{t.label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function BrandKBTab() {
  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">Brand Files</p>
      {MOCK_BRAND_FILES.map(f => (
        <div key={f.name} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors cursor-pointer group">
          <div className="h-7 w-7 rounded bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
            <p className="text-[10px] text-muted-foreground">{f.size} · {f.updated}</p>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      ))}
      <button className="w-full mt-2 rounded-lg border-2 border-dashed border-border/60 py-2 text-[11px] text-muted-foreground hover:border-orange-300 hover:text-orange-600 transition-colors">
        + Upload file
      </button>
    </div>
  );
}

function AgentsTab() {
  const statusColor = (s: string) => s === 'online' ? 'bg-green-500' : s === 'working' ? 'bg-orange-400' : 'bg-gray-400';
  const statusLabel = (s: string) => s === 'online' ? 'Ready' : s === 'working' ? 'Working...' : 'Idle';
  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">Your AI Team</p>
      {MOCK_AGENTS.map(a => (
        <div key={a.name} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors">
          <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0', a.color)}>
            {a.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground">{a.name}</p>
            <p className="text-[10px] text-muted-foreground">{a.role}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className={cn('h-1.5 w-1.5 rounded-full', statusColor(a.status))} />
            <span className="text-[10px] text-muted-foreground">{statusLabel(a.status)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RightPanelProps {
  className?: string;
}

export function RightPanel({ className }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('metrics');

  return (
    <div className={cn(
      "w-72 flex-shrink-0 border-l border-border/60 bg-background/50 flex flex-col overflow-hidden",
      className
    )}>
      {/* Tab bar */}
      <div className="flex border-b border-border/60 bg-background px-2 pt-2 gap-0.5 flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-t-md text-[11px] font-medium transition-colors border-b-2 -mb-px',
                active
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-900/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <ScrollArea className="flex-1">
        {activeTab === 'metrics' && <MetricsTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'brand' && <BrandKBTab />}
        {activeTab === 'agents' && <AgentsTab />}
      </ScrollArea>
    </div>
  );
}
