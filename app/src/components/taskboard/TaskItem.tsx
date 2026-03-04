import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/chat';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const agentTagMatch = task.label.match(/^\[([^\]•]+)(?:\s*•[^\]]+)?\]\s*/);
  const agentTag = agentTagMatch?.[1]?.trim() || null;
  const taskLabel = agentTagMatch ? task.label.replace(agentTagMatch[0], '') : task.label;

  return (
    <div
      className="relative flex items-start gap-2 py-1.5 px-1 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/10 group cursor-pointer"
      onClick={() => onToggle(task.id)}
    >
      {/* Toggle circle / checkmark */}
      <div className={cn(
        "mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
        task.completed
          ? "bg-orange-500 border-orange-500"
          : "border-gray-400 group-hover:border-orange-400"
      )}>
        {task.completed && (
          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1 pr-5">
        <span
          className={cn(
            "block text-sm leading-snug",
            task.completed
              ? "line-through text-gray-400 dark:text-gray-600"
              : "text-gray-700 dark:text-gray-300"
          )}
        >
          {taskLabel}
        </span>

        {agentTag && (
          <span className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            {agentTag}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(task.id);
        }}
        className="absolute right-1 top-1 flex-shrink-0 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:text-red-400"
        title="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
