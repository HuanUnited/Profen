import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Flame, TrendingUp, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { GetAllAttempts } from '../../../wailsjs/go/app/App';
import { ent } from '../../../wailsjs/go/models';

interface DayActivity {
  date: Date;
  count: number;
  attempts: ent.Attempt[];
}

interface HeatmapData {
  [dateKey: string]: DayActivity;
}

export default function ActivityHeatmapPanel() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  const { data: allAttempts, isLoading } = useQuery({
    queryKey: ['allAttempts'],
    queryFn: GetAllAttempts,
  });

  const heatmapData: HeatmapData = {};

  if (allAttempts) {
    allAttempts.forEach((attempt) => {
      if (!attempt.created_at) return;
      const date = new Date(attempt.created_at);
      const dateKey = date.toISOString().split('T')[0];
      if (!heatmapData[dateKey]) {
        heatmapData[dateKey] = { date: date, count: 0, attempts: [] };
      }
      heatmapData[dateKey].count++;
      heatmapData[dateKey].attempts.push(attempt);
    });
  }

  const calculateStreak = () => {
    const sortedDates = Object.keys(heatmapData).sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      if (date.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else { break; }
    }
    let lastDate: Date | null = null;
    sortedDates.reverse().forEach((dateKey) => {
      const date = new Date(dateKey);
      if (!lastDate) { tempStreak = 1; }
      else {
        const dayDiff = Math.floor((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) { tempStreak++; }
        else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
      }
      lastDate = date;
    });
    longestStreak = Math.max(longestStreak, tempStreak);
    return { current: currentStreak, longest: longestStreak };
  };

  const streak = calculateStreak();

  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 7) return 2;
    if (count <= 12) return 3;
    return 4;
  };

  const generateMonthGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const allDays: DayActivity[] = [];
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      allDays.push({ date: new Date(0), count: 0, attempts: [] });
    }
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = heatmapData[dateKey] || { date: date, count: 0, attempts: [] };
      allDays.push(dayData);
    }
    const endDayOfWeek = lastDay.getDay();
    for (let i = endDayOfWeek; i < 6; i++) {
      allDays.push({ date: new Date(0), count: 0, attempts: [] });
    }
    return allDays;
  };

  const monthDays = generateMonthGrid();

  const getCellColor = (level: number) => {
    switch (level) {
      case 0: return "bg-[#16161e] border-[#2f334d]";
      case 1: return "bg-emerald-500/20 border-emerald-500/30";
      case 2: return "bg-emerald-500/40 border-emerald-500/50";
      case 3: return "bg-emerald-500/60 border-emerald-500/70";
      case 4: return "bg-emerald-500 border-emerald-400";
      default: return "bg-[#16161e] border-[#2f334d]";
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') { newMonth.setMonth(newMonth.getMonth() - 1); }
    else { newMonth.setMonth(newMonth.getMonth() + 1); }
    setCurrentMonth(newMonth);
  };

  if (isLoading) {
    return <div className="bg-[#1a1b26] border border-[#2f334d] rounded-lg p-5 h-75 animate-pulse" />;
  }

  return (
    <div className="bg-[#1a1b26] border border-[#2f334d] rounded-lg p-5 animate-in slide-in-from-bottom-4 duration-700 delay-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#89b4fa]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Activity</h3>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth('prev')} className="p-1 hover:bg-[#2f334d] rounded transition-colors">
            <ChevronLeft size={14} className="text-gray-400" />
          </button>
          <span className="text-[10px] font-bold text-gray-400 min-w-17.5 text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth('next')} className="p-1 hover:bg-[#2f334d] rounded transition-colors">
            <ChevronRight size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Streak Display */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 rounded-md flex-1">
          <Flame size={12} className="text-orange-400" />
          <span className="text-[10px] font-bold text-orange-400">{streak.current}d</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 rounded-md flex-1">
          <TrendingUp size={12} className="text-purple-400" />
          <span className="text-[10px] font-bold text-purple-400">{streak.longest}d</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-[9px] text-gray-600 font-bold">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, idx) => {
            const isEmpty = day.date.getTime() === 0;
            const intensity = getIntensityLevel(day.count);
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();

            return (
              <div
                key={idx}
                className={clsx(
                  "aspect-square rounded-[3px] border transition-all duration-200 relative",
                  isEmpty ? "opacity-0 pointer-events-none" : "cursor-pointer hover:ring-2 hover:ring-[#89b4fa]",
                  getCellColor(intensity),
                  isToday && "ring-2 ring-blue-400",
                  isSelected && "ring-2 ring-white"
                )}
                onMouseEnter={() => !isEmpty && setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => !isEmpty && (isSelected ? setSelectedDay(null) : day.count > 0 && setSelectedDay(day))}
              >
                {!isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-400">
                    {day.date.getDate()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-[#2f334d]/50">
        <span className="text-[9px] text-gray-500">Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} className={clsx("w-2 h-2 rounded-xs border", getCellColor(level))} />
        ))}
        <span className="text-[9px] text-gray-500">More</span>
      </div>

      {/* Collapsible Details - SMOOTH ANIMATION */}
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-in-out",
          selectedDay && selectedDay.attempts.length > 0 ? "max-h-75 opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        {selectedDay && selectedDay.attempts.length > 0 && (
          <div className="pt-3 border-t border-[#2f334d]">
            <button onClick={() => setSelectedDay(null)} className="flex items-center justify-between w-full mb-3 group">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {selectedDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] text-gray-500">
                  {selectedDay.count} {selectedDay.count === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              <ChevronUp size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {selectedDay.attempts.map((attempt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-[#16161e] border border-[#2f334d] rounded-md hover:border-[#89b4fa] transition-colors animate-in fade-in slide-in-from-top-1 duration-200"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "text-[9px] px-1.5 py-0.5 border rounded uppercase font-bold",
                      attempt.is_correct ? "border-emerald-700 text-emerald-400 bg-emerald-900/20" : "border-red-700 text-red-400 bg-red-900/20"
                    )}>{attempt.is_correct ? '✓' : '✗'}</span>
                    <span className="text-[9px] text-gray-500 font-mono">R{attempt.rating}</span>
                    <span className="text-[9px] text-gray-500">{Math.round((attempt.duration_ms || 0) / 1000)}s</span>
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono">
                    {new Date(attempt.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.date.getTime() !== 0 && !selectedDay && (
        <div className="fixed z-50 px-2 py-1 bg-[#16161e] border border-[#89b4fa]/50 rounded shadow-xl pointer-events-none"
          style={{ left: `${(window.event as MouseEvent)?.clientX || 0}px`, top: `${((window.event as MouseEvent)?.clientY || 0) - 40}px`, transform: 'translateX(-50%)' }}>
          <p className="text-[10px] font-bold text-white whitespace-nowrap">
            {hoveredDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-[9px] text-gray-400">{hoveredDay.count} attempts</p>
        </div>
      )}
    </div>
  );
}
