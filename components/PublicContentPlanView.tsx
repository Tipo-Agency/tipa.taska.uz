import React, { useState, useEffect, useMemo } from 'react';
import { ContentPost, TableCollection } from '../types';
import { Calendar, Instagram, Send, Youtube, Linkedin, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { api } from '../backend/api';
import { DynamicIcon } from './AppIcons';

interface PublicContentPlanViewProps {
  tableId: string;
}

const PublicContentPlanView: React.FC<PublicContentPlanViewProps> = ({ tableId }) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [table, setTable] = useState<TableCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'gantt'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Состояние темы с сохранением в localStorage
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('publicContentPlanDarkMode');
      if (saved !== null) return saved === 'true';
      // По умолчанию темная тема
      return true;
    }
    return true;
  });

  // Применяем класс dark к document.documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('publicContentPlanDarkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    // Загружаем данные напрямую из Firebase
    const loadData = async () => {
      try {
        setLoading(true);
        const [allPosts, allTables] = await Promise.all([
          api.contentPosts.getAll(),
          api.tables.getAll(),
        ]);
        
        const filteredPosts = allPosts.filter(p => p.tableId === tableId && !p.isArchived);
        const foundTable = allTables.find(t => t.id === tableId);
        
        setPosts(filteredPosts);
        setTable(foundTable || null);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tableId]);

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case 'instagram': return <Instagram size={14} className="text-pink-600 dark:text-pink-400"/>;
      case 'telegram': return <Send size={14} className="text-blue-500 dark:text-blue-400"/>;
      case 'youtube': return <Youtube size={14} className="text-red-600 dark:text-red-400"/>;
      case 'linkedin': return <Linkedin size={14} className="text-blue-700 dark:text-blue-400"/>;
      default: return <Send size={14} className="text-gray-600 dark:text-gray-400"/>;
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'idea': return 'Идея';
      case 'copywriting': return 'Копирайтинг';
      case 'design': return 'Дизайн';
      case 'approval': return 'Согласование';
      case 'scheduled': return 'План';
      case 'published': return 'Готово';
      default: return s;
    }
  };

  const getFormatLabel = (f: string) => {
    switch (f) {
      case 'reel': return 'Reels';
      case 'post': return 'Пост';
      case 'story': return 'Stories';
      default: return f;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'idea': return 'border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#2a2a2a]';
      case 'copywriting': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'design': return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'approval': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'scheduled': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'published': return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#2a2a2a]';
    }
  };

  const getStatusBadgeColor = (s: string) => {
    switch (s) {
      case 'idea': return 'border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300';
      case 'copywriting': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'design': return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'approval': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      case 'scheduled': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'published': return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300';
      default: return 'border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300';
    }
  };

  const filteredPosts = useMemo(
    () =>
      posts
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [posts]
  );

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const renderPlatformIcons = (platforms: string | string[]) => {
    const arr = Array.isArray(platforms) ? platforms : [platforms];
    return (
      <div className="flex -space-x-1">
        {arr.map((p) => (
          <div
            key={p}
            className="bg-white dark:bg-[#303030] rounded-full p-0.5 border border-gray-100 dark:border-gray-600"
          >
            {getPlatformIcon(p)}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); 
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const calendarCells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) calendarCells.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarCells.push(i);

    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="bg-gray-50 dark:bg-[#252525] p-3 border-b border-gray-200 dark:border-[#333] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="font-bold text-gray-800 dark:text-white uppercase tracking-wide text-sm text-center">
              {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#333] rounded"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Сегодня
          </button>
        </div>

        <div className="grid grid-cols-7 bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-[#333] text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2 shrink-0">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white dark:bg-[#1e1e1e] flex-1 overflow-y-auto custom-scrollbar">
          {calendarCells.map((day, idx) => {
            let dateString = '';
            if (day) {
              const m = (currentMonth + 1).toString().padStart(2, '0');
              const d = day.toString().padStart(2, '0');
              dateString = `${currentYear}-${m}-${d}`;
            }

            const dayPosts = day
              ? filteredPosts.filter((p) => {
                  const postDate = p.date.split('T')[0];
                  return postDate === dateString;
                })
              : [];

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-r border-b border-gray-100 dark:border-[#333] p-1 transition-colors ${
                  !day ? 'bg-gray-50/30 dark:bg-[#151515]' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'
                }`}
              >
                {day && (
                  <>
                    <div className="text-right text-xs text-gray-400 mb-1 mr-1">{day}</div>
                    <div className="space-y-1">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          className={`p-1.5 rounded border text-[10px] cursor-default shadow-sm ${getStatusColor(
                            post.status
                          )}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              {renderPlatformIcons(post.platform)}
                              <span className="font-bold opacity-80 text-gray-700 dark:text-gray-300">
                                {getFormatLabel(post.format)}
                              </span>
                            </div>
                          </div>
                          <div className="line-clamp-2 leading-tight font-medium text-gray-800 dark:text-gray-200">
                            {post.topic}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTable = () => (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-200 dark:border-[#333] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-32">Дата</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Тема</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-32">Площадка</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-24">Формат</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-32">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {new Date(post.date)
                    .toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                    .replace(/\//g, '.')}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{post.topic}</td>
                <td className="px-4 py-3">{renderPlatformIcons(post.platform)}</td>
                <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                  {getFormatLabel(post.format)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${getStatusBadgeColor(
                      post.status
                    )}`}
                  >
                    {getStatusLabel(post.status)}
                  </span>
                </td>
              </tr>
            ))}
            {filteredPosts.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm"
                >
                  Публичных постов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGantt = () => {
    const timestamps = filteredPosts
      .map((p) => new Date(p.date).getTime())
      .filter((t) => !isNaN(t));

    let minTime = timestamps.length ? Math.min(...timestamps) : new Date().getTime();
    let maxTime = timestamps.length ? Math.max(...timestamps) : new Date().getTime();

    minTime -= 7 * 24 * 60 * 60 * 1000;
    maxTime += 14 * 24 * 60 * 60 * 1000;

    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    const months: { name: string; year: number }[] = [];
    const curr = new Date(startDate);
    curr.setDate(1);
    while (curr < endDate) {
      months.push({
        name: curr.toLocaleString('ru-RU', { month: 'short' }),
        year: curr.getFullYear(),
      });
      curr.setMonth(curr.getMonth() + 1);
    }

    const getPosition = (dateStr: string) => {
      const d = new Date(dateStr);
      const diff = (d.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      return Math.max(0, Math.min(100, (diff / totalDays) * 100));
    };

    const platforms = ['instagram', 'telegram', 'vk', 'youtube', 'linkedin'];
    const groupedPosts = platforms
      .map((plat) => ({
        platform: plat,
        posts: filteredPosts.filter((p) =>
          Array.isArray(p.platform) ? p.platform.includes(plat) : p.platform === plat
        ),
      }))
      .filter((g) => g.posts.length > 0);

    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex border-b border-gray-200 dark:border-[#333] h-10 bg-gray-50 dark:bg-[#252525] shrink-0">
          <div className="w-48 border-r border-gray-200 dark:border-[#333] shrink-0 p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center bg-gray-50 dark:bg-[#252525] z-20">
            Площадка
          </div>
          <div className="flex-1 flex relative overflow-hidden">
            {months.map((m, i) => (
              <div
                key={i}
                className="flex-1 border-l border-gray-200 dark:border-[#333] text-xs text-gray-500 dark:text-gray-400 p-2 font-medium text-center uppercase"
              >
                {m.name} {m.year}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pb-20 custom-scrollbar relative">
          <div className="absolute inset-0 flex pointer-events-none pl-48">
            {months.map((_, i) => (
              <div
                key={i}
                className="flex-1 border-l border-dashed border-gray-100 dark:border-[#2a2a2a] h-full"
              ></div>
            ))}
          </div>

          {groupedPosts.map((group) => (
            <div key={group.platform} className="relative">
              <div className="bg-gray-50/90 dark:bg-[#252525]/90 backdrop-blur px-3 py-1.5 text-[10px] uppercase font-bold text-gray-600 dark:text-gray-300 sticky top-0 border-b border-gray-100 dark:border-[#333] z-10 flex items-center gap-2">
                {getPlatformIcon(group.platform)} {group.platform}
              </div>
              {group.posts.map((post) => {
                const left = getPosition(post.date);
                const width = 2;
                return (
                  <div
                    key={post.id}
                    className="flex h-8 hover:bg-blue-50/30 dark:hover:bg-[#2a2a2a] border-b border-gray-50 dark:border-[#2a2a2a] group relative"
                  >
                    <div className="w-48 border-r border-gray-200 dark:border-[#333] shrink-0 px-3 text-xs truncate text-gray-700 dark:text-gray-300 flex items-center bg-white dark:bg-[#1e1e1e] z-10">
                      {post.topic}
                    </div>
                    <div className="flex-1 relative flex items-center my-1 pr-4">
                      <div
                        className={`absolute h-5 rounded-md border shadow-sm flex items-center justify-center z-0 ${getStatusColor(
                          post.status
                        )}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          minWidth: '24px',
                        }}
                        title={`${post.topic} (${new Date(post.date)
                          .toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                          .replace(/\//g, '.')})`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                      </div>
                      <div
                        style={{ left: `calc(${left}% + 30px)` }}
                        className="absolute text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[200px] pointer-events-none"
                      >
                        {post.topic}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="p-12 text-center text-gray-400 dark:text-gray-600 text-sm">
              Нет постов для отображения на таймлайне
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Контент-план не найден</h1>
          <p className="text-gray-500 dark:text-gray-400">Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  const getIconBgColor = () => {
    if (!table?.color) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (table.color.includes('bg-') && table.color.includes('text-')) {
      return table.color;
    }
    const bgMatch = table.color.match(/bg-(\w+)-(\d+)/);
    if (bgMatch) {
      const colorName = bgMatch[1];
      return `bg-${colorName}-100 dark:bg-${colorName}-900/30 text-${colorName}-600 dark:text-${colorName}-400`;
    }
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#121212] flex flex-col">
      <div className="max-w-7xl mx-auto w-full pt-8 px-4 sm:px-6 flex-shrink-0">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`${getIconBgColor()} p-2 rounded-lg`}>
                <DynamicIcon
                  name={table.icon || 'FileText'}
                  className={table.color || 'text-blue-600'}
                  size={24}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">
                  {table.name}
                </h1>
                <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Публичный контент-план
                </p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              aria-label={darkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
              title={darkMode ? 'Светлая тема' : 'Темная тема'}
            >
              {darkMode ? (
                <Sun size={20} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon size={20} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#252525] rounded-full p-1 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-full ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Календарь
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-full ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-full ${
                viewMode === 'gantt'
                  ? 'bg-white dark:bg-[#191919] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Таймлайн
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-20">
          {viewMode === 'calendar' && renderCalendar()}
          {viewMode === 'table' && renderTable()}
          {viewMode === 'gantt' && renderGantt()}

          {filteredPosts.length === 0 && (
            <div className="bg-white dark:bg-[#252525] rounded-lg shadow-sm p-12 text-center mt-6">
              <p className="text-gray-500 dark:text-gray-400">Контент-план пуст</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicContentPlanView;

