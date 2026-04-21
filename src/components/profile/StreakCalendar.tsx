"use client";

import { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { subDays, format } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import "react-calendar-heatmap/dist/styles.css";

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

type HeatmapCalendarValue = {
  date: string;
  count?: number;
  [key: string]: unknown;
};

export default function StreakCalendar({ activityLogs }: StreakCalendarProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const endDate = new Date();
  const startDate = subDays(endDate, 180); // Show last 6 months roughly

  const values = useMemo(() => {
    const counts = new Map<string, number>();

    activityLogs.forEach((log) => {
      // Ensure we use the date correctly formatted without timezone issues
      const dateStr = format(new Date(log.createdAt), "yyyy-MM-dd");
      counts.set(dateStr, (counts.get(dateStr) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }, [activityLogs]);

  // Determine css class based on count intensity
  const getClassForValue = (value: HeatmapCalendarValue | undefined) => {
    const count = typeof value?.count === "number" ? value.count : 0;
    if (!value || count === 0) {
      return "color-empty fill-[var(--surface)] stroke-[var(--border-color)] stroke-1";
    }
    if (count >= 10)
      return "color-scale-4 fill-primary-600 dark:fill-primary-400";
    if (count >= 5)
      return "color-scale-3 fill-primary-500/80 dark:fill-primary-500/80";
    if (count >= 2)
      return "color-scale-2 fill-primary-500/60 dark:fill-primary-500/60";
    return "color-scale-1 fill-primary-500/30 dark:fill-primary-500/30";
  };

  const monthLabelsRaw = tCommon("months_short").split(",");
  const weekdayLabelsRaw = tCommon("weekdays_short").split(",");
  const monthLabels =
    monthLabelsRaw.length === 12
      ? (monthLabelsRaw as unknown as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ])
      : ([
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ] as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ]);
  const weekdayLabels =
    weekdayLabelsRaw.length === 7
      ? (weekdayLabelsRaw as unknown as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ])
      : (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ]);

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg)] p-6 shadow-sm">
      <h3 className="mb-6 text-2xl font-bold text-[var(--fg)]">
        {t("learning_activity")}
      </h3>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          <CalendarHeatmap<string>
            startDate={startDate}
            endDate={endDate}
            values={values}
            classForValue={getClassForValue}
            showWeekdayLabels={true}
            monthLabels={monthLabels}
            weekdayLabels={weekdayLabels}
            titleForValue={(value: HeatmapCalendarValue | undefined) => {
              if (!value || !value.date) {
                return t("no_activity");
              }
              const count = typeof value.count === "number" ? value.count : 0;
              const formattedDate = new Intl.DateTimeFormat(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(value.date));
              return t("activities_on", { count, date: formattedDate });
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-sm text-[var(--fg)]/50">
        <span>{t("less")}</span>
        <div className="h-3 w-3 rounded-sm bg-[var(--surface)] border border-[var(--border-color)]"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/30"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/60"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-500/80"></div>
        <div className="h-3 w-3 rounded-sm bg-primary-600 dark:bg-primary-400"></div>
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
