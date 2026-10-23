import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DashboardClockProps {
  className?: string;
}

export const DashboardClock: React.FC<DashboardClockProps> = ({ className = '' }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time in user's default locale and timezone
  const formattedTime = time.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  // Extract short timezone abbreviation for user's default timezone
  const timeZoneAbbr = (() => {
    try {
      const parts = new Intl.DateTimeFormat([], {
        timeZoneName: 'short',
      }).formatToParts(time);
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      return tzPart ? tzPart.value : '';
    } catch {
      return '';
    }
  })();

  const fullTimeZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return '';
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white/15 text-white border border-white/20 backdrop-blur-xs tabular-nums select-none ${className}`}
      title={fullTimeZone ? `Local Time (${fullTimeZone})` : 'Local Time'}
    >
      <Clock className="w-3.5 h-3.5 text-white/90 shrink-0" />
      <span>{formattedTime}</span>
      {timeZoneAbbr && (
        <span className="text-[10px] text-white/70 font-medium tracking-wide uppercase">
          {timeZoneAbbr}
        </span>
      )}
    </span>
  );
};
