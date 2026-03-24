import React from 'react';
import { CheckCircle2, Circle, Trash2, Clock, Tag, MoreVertical, Bell, BellOff } from 'lucide-react';
import { Task } from '../types';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  key?: React.Key;
}

const categoryColors: Record<string, string> = {
  kerja: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  pribadi: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  kesehatan: 'bg-rose-50 text-rose-600 border-rose-100',
  belajar: 'bg-amber-50 text-amber-600 border-amber-100',
  lainnya: 'bg-zinc-50 text-zinc-600 border-zinc-100',
};

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "group relative flex items-start gap-4 p-4 bg-white rounded-2xl border border-black/5 shadow-sm transition-all hover:shadow-md",
        task.completed && "opacity-60 grayscale-[0.5]"
      )}
    >
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className="mt-1 p-1 hover:bg-zinc-100 rounded-full transition-colors"
      >
        {task.completed ? (
          <CheckCircle2 size={24} className="text-emerald-500" />
        ) : (
          <Circle size={24} className="text-zinc-300 group-hover:text-zinc-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            categoryColors[task.category] || categoryColors.other
          )}>
            {task.category}
          </span>
          <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
            <Clock size={12} />
            {task.startTime} - {task.endTime}
          </span>
          {task.alarmEnabled && !task.completed && (
            <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
              <Bell size={12} />
              Alarm
            </span>
          )}
        </div>
        
        <h3 className={cn(
          "text-base font-semibold text-zinc-900 truncate transition-all",
          task.completed && "line-through text-zinc-400"
        )}>
          {task.title}
        </h3>
        
        {task.description && (
          <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 hover:bg-rose-50 text-zinc-400 hover:text-rose-500 rounded-xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
