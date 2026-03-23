import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types/chat';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { removeTask as removeStoredTask } from '@/lib/taskStore';
import { fetchJson } from '@/components/modules/company-intelligence/api';

type Horizon = 'day' | 'week' | 'month';
type DeploymentEntry = {
  id: string;
  agentName: string;
  workspaceId?: string | null;
  agentTarget?: string | null;
  sectionTitle?: string | null;
  tasks?: Array<{ label: string; horizon?: Horizon }>;
  scheduleMode?: string | null;
  status?: string;
  scheduledFor?: string | null;
  createdAt?: string;
};

const STORAGE_KEY = 'marqq_tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    return parsed.map(t => ({
      ...t,
      createdAt: new Date(t.createdAt),
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function Taskboard({
  collapsed: collapsedProp,
  onCollapsedChange,
}: {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [horizon, setHorizon] = useState<Horizon>('day');
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = collapsedProp ?? internalCollapsed;

  const setCollapsed = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(collapsed) : next;
    if (collapsedProp === undefined) {
      setInternalCollapsed(resolved);
    }
    onCollapsedChange?.(resolved);
  }, [collapsed, collapsedProp, onCollapsedChange]);

  // Reload when ChatHome adds an AI task
  useEffect(() => {
    const handler = () => setTasks(loadTasks());
    window.addEventListener('torqq:task-added', handler);
    return () => window.removeEventListener('torqq:task-added', handler);
  }, []);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [deployments, setDeployments] = useState<DeploymentEntry[]>([]);

  const visibleTasks = tasks.filter(t => t.horizon === horizon);
  const selectedDayKey = selectedDate.toDateString();

  const scheduledEntries = useMemo(() => {
    return deployments
      .filter((deployment) => ['active', 'paused', 'pending', 'running'].includes(String(deployment.status || '')))
      .map((deployment) => {
        const when = deployment.scheduledFor ? new Date(deployment.scheduledFor) : deployment.createdAt ? new Date(deployment.createdAt) : null;
        return {
          ...deployment,
          when,
        };
      })
      .filter((deployment) => deployment.when && !Number.isNaN(deployment.when.getTime()));
  }, [deployments]);

  const scheduledTasksForDay = useMemo(() => {
    return scheduledEntries.filter((deployment) => deployment.when?.toDateString() === selectedDayKey);
  }, [scheduledEntries, selectedDayKey]);

  const calendarHighlightedDays = useMemo(() => scheduledEntries.map((deployment) => deployment.when as Date).filter(Boolean), [scheduledEntries]);

  const loadDeployments = useCallback(async () => {
    try {
      const raw = localStorage.getItem('marqq_active_workspace');
      const activeWorkspace = raw ? JSON.parse(raw) : null;
      const workspaceId = typeof activeWorkspace?.id === 'string' ? activeWorkspace.id : null;
      const response = await fetchJson<{ deployments?: DeploymentEntry[] }>('/api/agents/deployments');
      const filtered = (response.deployments || []).filter((deployment) => {
        if (!workspaceId) return true;
        return !deployment.workspaceId || deployment.workspaceId === workspaceId;
      });
      setDeployments(filtered);
    } catch {
      setDeployments([]);
    }
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    void loadDeployments();
  }, [calendarOpen, loadDeployments]);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined }
          : t
      );
      saveTasks(updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter((task) => task.id !== id));
    removeStoredTask(id);
  }, []);

  const addTask = () => {
    const label = newLabel.trim();
    if (!label) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      label,
      completed: false,
      horizon,
      createdAt: new Date(),
      source: 'manual',
    };
    setTasks(prev => {
      const updated = [...prev, task];
      saveTasks(updated);
      return updated;
    });
    setNewLabel('');
    setAdding(false);
  };

  const pending = visibleTasks.filter(t => !t.completed);
  const completed = visibleTasks.filter(t => t.completed);

  if (collapsed) {
    return (
      <div className="flex h-full w-8 flex-shrink-0 flex-col border-l border-border/70 bg-background/90 backdrop-blur">
        <button
          onClick={() => setCollapsed(false)}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
          title="Show tasks"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="rotate-90 whitespace-nowrap">Tasks</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col border-l border-border/70 bg-background/90 backdrop-blur">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCalendarOpen(true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
                title="View scheduled tasks calendar"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Hide tasks"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 rounded-lg bg-muted/70 p-0.5">
            {(['day', 'week', 'month'] as Horizon[]).map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={cn(
                  "flex-1 text-xs py-1 rounded-md font-medium transition-colors capitalize",
                  horizon === h
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1 px-3">
        {pending.length === 0 && completed.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No tasks for this {horizon}</p>
        ) : (
          <>
            {pending.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
            {completed.length > 0 && pending.length > 0 && (
              <div className="border-t my-2" />
            )}
            {completed.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
            ))}
          </>
        )}
      </ScrollArea>

      {/* Add task */}
      <div className="px-3 pb-4 pt-2 border-t">
        {adding ? (
          <div className="flex gap-1">
            <Input
              autoFocus
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTask();
                if (e.key === 'Escape') { setAdding(false); setNewLabel(''); }
              }}
              placeholder="Task name…"
              className="h-7 text-xs"
            />
            <Button size="sm" className="h-7 px-2 bg-orange-500 hover:bg-orange-600 text-white text-xs" onClick={addTask}>Add</Button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-orange-500 dark:hover:text-orange-400"
          >
            <span className="text-base leading-none">+</span>
            <span>Add task</span>
          </button>
        )}
      </div>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scheduled Tasks Calendar</DialogTitle>
            <DialogDescription>
              Review scheduled tasks by date and inspect what is queued for the selected day.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-border/60 bg-background/80">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{ scheduled: calendarHighlightedDays }}
                modifiersClassNames={{
                  scheduled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 font-bold'
                }}
                className="w-full"
              />
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-4">
              <div className="mb-3 text-sm font-semibold text-foreground">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <ScrollArea className="h-[320px] pr-3">
                {scheduledTasksForDay.length ? (
                  <div className="space-y-3">
                    {scheduledTasksForDay.map((deployment) => (
                      <div key={deployment.id} className="rounded-lg border border-border/60 bg-background/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-foreground">
                            {deployment.agentTarget || deployment.sectionTitle || deployment.agentName}
                          </div>
                          <div className="text-[11px] font-medium uppercase tracking-wide text-orange-600 dark:text-orange-300">
                            {deployment.status}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {deployment.when?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Scheduled'}
                        </div>
                        <div className="mt-2 space-y-1">
                          {(deployment.tasks || []).length ? (
                            deployment.tasks!.map((task, idx) => (
                              <div key={`${deployment.id}-${idx}`} className="text-sm text-foreground">
                                • {task.label}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">No task details available.</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No scheduled tasks for this date.</div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
