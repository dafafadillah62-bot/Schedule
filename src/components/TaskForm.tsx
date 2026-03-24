import React, { useState } from 'react';
import { Plus, X, Clock, Tag, FileText, Bell, BellOff } from 'lucide-react';
import { NewTask } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TaskFormProps {
  onAdd: (task: NewTask) => void;
  onClose: () => void;
}

export default function TaskForm({ onAdd, onClose }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('work');
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    onAdd({ title, description, startTime, endTime, category, alarmEnabled });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white p-6 rounded-2xl shadow-xl border border-black/5"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">Tambah Jadwal Baru</h2>
        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <X size={20} className="text-zinc-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Judul</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
            placeholder="Apa yang Anda rencanakan?"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all resize-none"
            placeholder="Tambahkan beberapa detail..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Waktu Mulai</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Waktu Selesai</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Kategori</label>
          <div className="flex flex-wrap gap-2">
            {['kerja', 'pribadi', 'kesehatan', 'belajar', 'lainnya'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${alarmEnabled ? 'bg-amber-100 text-amber-600' : 'bg-zinc-200 text-zinc-500'}`}>
              {alarmEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Aktifkan Alarm</p>
              <p className="text-xs text-zinc-500">Beri tahu saya saat tugas ini dimulai</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlarmEnabled(!alarmEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${alarmEnabled ? 'bg-zinc-900' : 'bg-zinc-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${alarmEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Plus size={20} />
          Tambah ke Jadwal
        </button>
      </form>
    </motion.div>
  );
}
