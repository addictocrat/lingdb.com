'use client';

import { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip } from 'react-tooltip';
import { subDays, format } from 'date-fns';
import { useTranslations, useLocale } from 'next-intl';
import 'react-calendar-heatmap/dist/styles.css';

interface StreakCalendarProps {
  activityLogs: {
    createdAt: Date;
    type: string;
  }[];
}

interface HeatmapValue {
  date: string;
  count: number;
}

export default function StreakCalendar({ activityLogs }: StreakCalendarProps) {
  const [values, setValues] = useState<HeatmapValue[]>([]);
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const endDate = new Date();
  const startDate = subDays(endDate, 180); // Show last 6 months roughly

  useEffect(() => {
    // Process logs into daily counts
    const counts = new Map<string, number>();

    activityLogs.forEach((log) => {
      // Ensure we use the date correctly formatted without timezone issues
      const dateStr = format(new Date(log.createdAt), 'yyyy-MM-dd');
      counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
    });

    const heatmapData = Array.from(counts.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    setValues(heatmapData);
  }, [activityLogs]);

  // Determine css class based on count intensity
  const getClassForValue = (value: any) => {
    if (!value || value.count === 0) {
      return 'color-empty fill-[var(--surface)] stroke-[var(--border-color)] stroke-1';
    }
    if (value.count >= 10) return 'color-scale-4 fill-primary-600 dark:fill-primary-400';
    if (value.count >= 5) return 'color-scale-3 fill-primary-500/80 dark:fill-primary-500/80';
    if (value.count >= 2) return 'color-scale-2 fill-primary-500/60 dark:fill-primary-500/60';
    return 'color-scale-1 fill-primary-500/30 dark:fill-primary-500/30';
  };

  const monthLabels = tCommon('months_short').split(',');
  const weekdayLabels = tCommon('weekdays_short').split(',');

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg)] p-6 shadow-sm">
      <h3 className="mb-6 text-2xl font-bold text-[var(--fg)]">{t('learning_activity')}</h3>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={values}
            classForValue={getClassForValue as any}
            showWeekdayLabels={true}
            monthLabels={monthLabels as any}
            weekdayLabels={weekdayLabels as any}
            tooltipDataAttrs={((value: HeatmapValue) => {
              if (!value || !value.date) {
                return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': t('no_activity') };
              }
              const formattedDate = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value.date));
              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-content': t('activities_on', { count: value.count, date: formattedDate }),
              };
            }) as any}
          />
        </div>
      </div>

      <Tooltip id="heatmap-tooltip" className="!bg-[var(--surface)] !text-[var(--fg)] !border !border-[var(--border-color)] !shadow-lg !rounded-lg !text-sm !font-medium z-50" />
      
      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-[var(--fg)]/50">
        <span>{t('less')}</span>
        <div className="h-3 w-3 rounded-sm bg-[var(--surface)] border border-[var(--border-color)]"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/30"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/60"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/80"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-600 dark:bg-primary-400"></div>
        <span>{t('more')}</span>
      </div>
    </div>
  );
}
