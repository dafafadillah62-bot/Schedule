import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Sparkles, Calendar, Clock, CheckCircle2, LayoutGrid, List, BrainCircuit, Loader2, RefreshCw, Bell, X } from 'lucide-react';
import { Task, NewTask } from './types';
import TaskItem from './components/TaskItem';
import TaskForm from './components/TaskForm';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";

const STORAGE_KEY = 'olivsela_tasks';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAlarmTime, setLastAlarmTime] = useState<string | null>(null);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const playAlarmSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const checkAlarms = useCallback(() => {
    const nowStr = format(currentTime, 'HH:mm');
    if (nowStr === lastAlarmTime) return;

    const alarmTask = tasks.find(t => t.startTime === nowStr && t.alarmEnabled && !t.completed);
    if (alarmTask) {
      setLastAlarmTime(nowStr);
      playAlarmSound();
      toast((t) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Bell size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Alarm: {alarmTask.title}</p>
            <p className="text-xs text-zinc-500">Saatnya memulai tugas ini!</p>
          </div>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="ml-4 p-1 hover:bg-zinc-100 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ), { duration: 10000 });

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Alarm: ${alarmTask.title}`, {
          body: `Saatnya memulai: ${alarmTask.startTime}`,
          icon: '/favicon.ico'
        });
      }
    }
  }, [currentTime, tasks, lastAlarmTime]);

  const fetchTasks = useCallback(() => {
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      toast.error('Gagal memuat tugas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    requestNotificationPermission();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchTasks]);

  useEffect(() => {
    checkAlarms();
  }, [currentTime, checkAlarms]);

  const saveTasksToStorage = (newTasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    setTasks(newTasks.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const addTask = async (newTask: NewTask) => {
    try {
      const task: Task = {
        ...newTask,
        id: Date.now(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updatedTasks = [...tasks, task];
      saveTasksToStorage(updatedTasks);
      toast.success('Tugas ditambahkan ke jadwal');
    } catch (error) {
      toast.error('Gagal menambahkan tugas');
    }
  };

  const toggleTask = async (id: number, completed: boolean) => {
    try {
      const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed } : t);
      saveTasksToStorage(updatedTasks);
      toast.success(completed ? 'Tugas selesai!' : 'Tugas dibuka kembali');
    } catch (error) {
      toast.error('Gagal memperbarui tugas');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const updatedTasks = tasks.filter(t => t.id !== id);
      saveTasksToStorage(updatedTasks);
      toast.success('Tugas dihapus');
    } catch (error) {
      toast.error('Gagal menghapus tugas');
    }
  };

  const suggestSchedule = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Harap masukkan apa yang ingin Anda capai hari ini');
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Kunci API Gemini tidak dikonfigurasi');
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given the current tasks: ${JSON.stringify(tasks)}. 
        User request: ${aiPrompt}. 
        Suggest a daily schedule in JSON format. 
        Each task should have: title, description, startTime (HH:mm), endTime (HH:mm), category.
        Ensure tasks don't overlap significantly.
        Berikan jawaban dalam bahasa Indonesia.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                startTime: { type: Type.STRING },
                endTime: { type: Type.STRING },
                category: { type: Type.STRING },
                alarmEnabled: { type: Type.BOOLEAN }
              },
              required: ["title", "startTime", "endTime"]
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text || "[]");
      
      if (suggestions.length > 0) {
        let updatedTasks = [...tasks];
        for (const s of suggestions) {
          const newTask: Task = {
            ...s,
            id: Date.now() + Math.random(),
            completed: false,
            createdAt: new Date().toISOString()
          };
          updatedTasks.push(newTask);
        }
        saveTasksToStorage(updatedTasks);
        toast.success(`Menambahkan ${suggestions.length} saran AI!`);
        setAiPrompt('');
      } else {
        toast.error('AI tidak dapat menghasilkan saran');
      }
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Saran AI gagal');
    } finally {
      setIsAiLoading(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Olivsela</h1>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Perencana Harian</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-zinc-900">{format(currentTime, 'EEEE, d MMMM', { locale: undefined })}</p>
              <p className="text-xs font-medium text-zinc-400 font-mono">{format(currentTime, 'HH:mm:ss')}</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/10"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Tugas Baru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & AI */}
        <div className="lg:col-span-4 space-y-6">
          {/* Progress Card */}
          <section className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Progres Hari Ini</h2>
                <p className="text-3xl font-bold text-zinc-900">{Math.round(progress)}%</p>
              </div>
              <p className="text-sm font-medium text-zinc-500">
                {completedCount}/{tasks.length} tugas
              </p>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-zinc-900 rounded-full"
              />
            </div>
          </section>

          {/* AI Suggestion Card */}
          <section className="bg-zinc-900 p-6 rounded-3xl text-white shadow-xl shadow-zinc-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Pengoptimal AI</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Beri tahu Olivsela apa yang ingin Anda capai hari ini, dan biarkan AI mengoptimalkan jadwal Anda.
            </p>
            <div className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="misal: Saya ingin fokus pada proyek coding saya dan pergi ke gym..."
                className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                rows={3}
              />
              <button
                onClick={suggestSchedule}
                disabled={isAiLoading}
                className="w-full py-3 bg-white text-zinc-900 rounded-xl font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <BrainCircuit size={18} />
                )}
                {isAiLoading ? 'Berpikir...' : 'Buat Jadwal'}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <List size={20} />
              Garis Waktu
            </h2>
            <button 
              onClick={fetchTasks}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-900 transition-all"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="space-y-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-zinc-200 hidden sm:block" />

            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 size={40} className="animate-spin mb-4" />
                  <p className="font-medium">Memuat hari Anda...</p>
                </div>
              ) : tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200"
                >
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4">
                    <Calendar size={32} />
                  </div>
                  <p className="text-zinc-500 font-medium">Tidak ada tugas yang dijadwalkan untuk hari ini</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="mt-4 text-zinc-900 font-bold hover:underline"
                  >
                    Tambah tugas pertama Anda
                  </button>
                </motion.div>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-lg">
              <TaskForm
                onAdd={addTask}
                onClose={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
