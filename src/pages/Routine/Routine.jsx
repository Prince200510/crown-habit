import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bell,
  BellOff,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  X
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { formatTime12h } from '../../utils/dateUtils';

const CATEGORIES = [
  'Hydration',
  'Nutrition',
  'Fitness',
  'Sleep',
  'Health',
  'Mindfulness',
  'Productivity',
  'General'
];

export default function Routine() {
  const {
    routines,
    todayRecord,
    updateHabitStatus,
    addOrUpdateRoutine,
    deleteRoutine,
    reorderRoutine
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Nutrition');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [followUpMinutes, setFollowUpMinutes] = useState(15);
  const [repeatSchedule, setRepeatSchedule] = useState('daily');
  const [active, setActive] = useState(true);

  const [inlineMacroId, setInlineMacroId] = useState(null);
  const [inlineMacros, setInlineMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const openCreateModal = () => {
    setEditingRoutine(null);
    setName('');
    setDescription('');
    setCategory('Nutrition');
    setScheduledTime('08:00');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setReminderEnabled(true);
    setFollowUpEnabled(true);
    setFollowUpMinutes(15);
    setRepeatSchedule('daily');
    setActive(true);
    setModalOpen(true);
  };

  const openEditModal = (routine) => {
    setEditingRoutine(routine);
    setName(routine.name || '');
    setDescription(routine.description || '');
    setCategory(routine.category || 'General');
    setScheduledTime(routine.scheduledTime || '08:00');
    setCalories(Number(routine.calories) || 0);
    setProtein(Number(routine.protein) || 0);
    setCarbs(Number(routine.carbs) || 0);
    setFat(Number(routine.fat) || 0);
    setReminderEnabled(routine.reminderEnabled !== false);
    setFollowUpEnabled(routine.followUpEnabled !== false);
    setFollowUpMinutes(routine.followUpMinutes || 15);
    setRepeatSchedule(routine.repeatSchedule || 'daily');
    setActive(routine.active !== false);
    setModalOpen(true);
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addOrUpdateRoutine({
      id: editingRoutine?.id,
      name: name.trim(),
      description: description.trim(),
      category,
      scheduledTime,
      calories: Math.max(0, Math.round(Number(calories) || 0)),
      protein: Math.max(0, Math.round((Number(protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(fat) || 0) * 10) / 10),
      reminderEnabled,
      followUpEnabled,
      followUpMinutes: Number(followUpMinutes) || 15,
      repeatSchedule,
      active
    });

    setModalOpen(false);
  };

  const openInlineMacroEditor = (routine) => {
    setInlineMacroId(routine.id);
    setInlineMacros({
      calories: Number(routine.calories) || 0,
      protein: Number(routine.protein) || 0,
      carbs: Number(routine.carbs) || 0,
      fat: Number(routine.fat) || 0
    });
  };

  const handleSaveInlineMacros = async (routine) => {
    await addOrUpdateRoutine({
      ...routine,
      calories: Math.max(0, Math.round(Number(inlineMacros.calories) || 0)),
      protein: Math.max(0, Math.round((Number(inlineMacros.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(inlineMacros.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(inlineMacros.fat) || 0) * 10) / 10)
    });
    setInlineMacroId(null);
  };

  const handleToggleActive = async (routine) => {
    await addOrUpdateRoutine({
      ...routine,
      active: !routine.active
    });
  };

  const handleToggleReminder = async (routine) => {
    await addOrUpdateRoutine({
      ...routine,
      reminderEnabled: !routine.reminderEnabled
    });
  };

  const statusesMap = todayRecord?.habitStatuses || {};

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-crown-text">My Daily Routine</h1>
          <p className="text-xs text-crown-muted mt-0.5">
            Create habits, schedule local reminders with follow-ups, and track today&apos;s completion.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crown-blue text-white text-xs font-semibold shadow-xs hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          Add New Habit
        </button>
      </div>

      <div className="space-y-3">
        {routines.map((routine, idx) => {
          const todayStatusObj = statusesMap[routine.id];
          const status = todayStatusObj?.status || 'pending';
          const completedAt = todayStatusObj?.updatedAt;

          return (
            <div
              key={routine.id}
              className={`bg-crown-card border rounded-xl p-4 shadow-card transition-all ${
                !routine.active
                  ? 'opacity-60 border-crown-border'
                  : status === 'completed'
                  ? 'border-emerald-300'
                  : 'border-crown-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  {routine.active ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateHabitStatus(
                          routine.id,
                          status === 'completed' ? 'pending' : 'completed'
                        )
                      }
                      className="mt-0.5 text-crown-teal focus:outline-none"
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-crown-teal" />
                      ) : (
                        <Circle className="w-6 h-6 text-crown-muted hover:text-crown-blue" />
                      )}
                    </button>
                  ) : (
                    <PauseCircle className="w-6 h-6 text-crown-muted mt-0.5" />
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          status === 'completed'
                            ? 'line-through text-crown-muted'
                            : 'text-crown-text'
                        }`}
                      >
                        {routine.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-crown-input text-crown-navy border border-crown-border">
                        {routine.category}
                      </span>
                      {!routine.active && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200 text-slate-700">
                          Paused
                        </span>
                      )}
                    </div>

                    {routine.description && (
                      <p className="text-xs text-crown-muted mt-1">{routine.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-crown-muted">
                      <span className="inline-flex items-center gap-1 font-semibold text-crown-navy whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-crown-blue shrink-0" />
                        {formatTime12h(routine.scheduledTime)}
                      </span>
                      <span className="capitalize whitespace-nowrap">
                        Repeat: {routine.repeatSchedule || 'daily'}
                      </span>
                      <span className="whitespace-nowrap">
                        {routine.reminderEnabled
                          ? `Reminder On${
                              routine.followUpEnabled
                                ? ` (+${routine.followUpMinutes || 15}m)`
                                : ''
                            }`
                          : 'Reminder Off'}
                      </span>
                      {completedAt && status !== 'pending' && (
                        <span className="text-[11px] text-crown-teal font-semibold whitespace-nowrap">
                          Marked {status} at{' '}
                          {new Date(completedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      {inlineMacroId === routine.id ? (
                        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-crown-input border border-crown-border">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-crown-muted">kcal:</span>
                            <input
                              type="number"
                              min="0"
                              value={inlineMacros.calories}
                              onChange={(e) =>
                                setInlineMacros((p) => ({ ...p, calories: e.target.value }))
                              }
                              className="w-16 px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-crown-muted">Protein(g):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={inlineMacros.protein}
                              onChange={(e) =>
                                setInlineMacros((p) => ({ ...p, protein: e.target.value }))
                              }
                              className="w-14 px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-crown-muted">Carbs(g):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={inlineMacros.carbs}
                              onChange={(e) =>
                                setInlineMacros((p) => ({ ...p, carbs: e.target.value }))
                              }
                              className="w-14 px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-crown-muted">Fat(g):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={inlineMacros.fat}
                              onChange={(e) =>
                                setInlineMacros((p) => ({ ...p, fat: e.target.value }))
                              }
                              className="w-14 px-2 py-1 rounded-md bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSaveInlineMacros(routine)}
                            className="px-2.5 py-1 rounded-md bg-crown-blue text-white text-[11px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineMacroId(null)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold text-crown-muted hover:text-crown-text"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openInlineMacroEditor(routine)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-[11px] font-semibold text-crown-navy transition-colors"
                        >
                          {Number(routine.calories) > 0 ||
                          Number(routine.protein) > 0 ||
                          Number(routine.carbs) > 0 ? (
                            <>
                              <span className="font-bold text-crown-blue">
                                {Number(routine.calories) || 0} kcal
                              </span>
                              <span>•</span>
                              <span>{Number(routine.protein) || 0}g P</span>
                              <span>•</span>
                              <span>{Number(routine.carbs) || 0}g C</span>
                              <span>•</span>
                              <span>{Number(routine.fat) || 0}g F</span>
                              <span className="text-crown-blue underline ml-1">Edit</span>
                            </>
                          ) : (
                            <span className="text-crown-blue">+ Set Task Calories / Protein / Carbs</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-crown-border">
                  {routine.active && (
                    <div className="flex items-center gap-1 mr-2">
                      <button
                        type="button"
                        onClick={() => updateHabitStatus(routine.id, 'completed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          status === 'completed'
                            ? 'bg-crown-teal text-white'
                            : 'bg-emerald-50 text-crown-teal hover:bg-emerald-100'
                        }`}
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateHabitStatus(
                            routine.id,
                            status === 'skipped' ? 'pending' : 'skipped'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          status === 'skipped'
                            ? 'bg-amber-500 text-white'
                            : 'bg-crown-input text-crown-muted hover:text-crown-text'
                        }`}
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateHabitStatus(
                            routine.id,
                            status === 'missed' ? 'pending' : 'missed'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          status === 'missed'
                            ? 'bg-crown-error text-white'
                            : 'bg-crown-input text-crown-muted hover:text-crown-error'
                        }`}
                      >
                        Missed
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Move Up"
                      disabled={idx === 0}
                      onClick={() => reorderRoutine(routine.id, 'up')}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-text hover:bg-crown-input disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Move Down"
                      disabled={idx === routines.length - 1}
                      onClick={() => reorderRoutine(routine.id, 'down')}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-text hover:bg-crown-input disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title={routine.reminderEnabled ? 'Disable Reminder' : 'Enable Reminder'}
                      onClick={() => handleToggleReminder(routine)}
                      className={`p-1.5 rounded-lg ${
                        routine.reminderEnabled
                          ? 'text-crown-blue bg-blue-50'
                          : 'text-crown-muted hover:bg-crown-input'
                      }`}
                    >
                      {routine.reminderEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title={routine.active ? 'Pause Habit' : 'Resume Habit'}
                      onClick={() => handleToggleActive(routine)}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-text hover:bg-crown-input"
                    >
                      {routine.active ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-crown-teal" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Edit Habit"
                      onClick={() => openEditModal(routine)}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-blue hover:bg-crown-input"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete Habit"
                      onClick={() => deleteRoutine(routine.id)}
                      className="p-1.5 rounded-lg text-crown-muted hover:text-crown-error hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-crown-navy/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-crown-card border border-crown-border rounded-xl shadow-elevated w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-crown-border">
              <h2 className="text-base font-bold text-crown-text">
                {editingRoutine ? 'Edit Routine Habit' : 'Create Routine Habit'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-crown-muted hover:text-crown-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Morning oats, Drink water, Evening walk"
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-sm text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-crown-text mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or preparation notes"
                  className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-crown-text mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-crown-text mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-crown-input border border-crown-border space-y-2">
                <div className="text-xs font-bold text-crown-navy">
                  Auto-Log Nutrition When Marked Done (Optional)
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-crown-muted mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-crown-border text-xs font-bold text-crown-text focus:outline-none focus:border-crown-blue"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-crown-text mb-1">
                    Repeat Schedule
                  </label>
                  <select
                    value={repeatSchedule}
                    onChange={(e) => setRepeatSchedule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays (Mon–Fri)</option>
                    <option value="weekends">Weekends (Sat–Sun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-crown-text mb-1">
                    Follow-up Delay (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={followUpMinutes}
                    onChange={(e) => setFollowUpMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text focus:outline-none focus:border-crown-blue"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-crown-input border border-crown-border cursor-pointer">
                  <span className="text-xs font-medium text-crown-text">
                    Enable Primary Scheduled Reminder
                  </span>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-4 h-4 accent-crown-blue"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-crown-input border border-crown-border cursor-pointer">
                  <span className="text-xs font-medium text-crown-text">
                    Enable Follow-up Reminder if Incomplete
                  </span>
                  <input
                    type="checkbox"
                    checked={followUpEnabled}
                    onChange={(e) => setFollowUpEnabled(e.target.checked)}
                    className="w-4 h-4 accent-crown-blue"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-crown-input border border-crown-border cursor-pointer">
                  <span className="text-xs font-medium text-crown-text">
                    Habit Active
                  </span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 accent-crown-teal"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-crown-muted hover:bg-crown-input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-crown-blue text-white hover:opacity-95"
                >
                  {editingRoutine ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
