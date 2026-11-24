import React, { useEffect, useRef, useState } from 'react';
import { SiteAnnouncement, AnnouncementCategory } from '../types';
import { useApp } from '../context/AppContext';
import { X, Check, ArrowRight } from 'lucide-react';

interface SiteAnnouncementDialogProps {
  announcement: SiteAnnouncement;
  queuedAnnouncements?: SiteAnnouncement[];
  isPreview?: boolean;
  remainingCount?: number;
  onClose: () => void;
}

const CATEGORY_COPY: Record<
  AnnouncementCategory,
  { label: string; toneClass: string; dotClass: string }
> = {
  feature: {
    label: 'New Feature',
    toneClass: 'text-[#005CBD] dark:text-blue-400',
    dotClass: 'bg-[#005CBD] dark:bg-blue-400',
  },
  fix: {
    label: 'Fix Shipped',
    toneClass: 'text-emerald-700 dark:text-emerald-400',
    dotClass: 'bg-emerald-600 dark:bg-emerald-400',
  },
  improvement: {
    label: 'Improvement',
    toneClass: 'text-amber-700 dark:text-amber-400',
    dotClass: 'bg-amber-600 dark:bg-amber-400',
  },
  notice: {
    label: 'Team Notice',
    toneClass: 'text-slate-700 dark:text-slate-300',
    dotClass: 'bg-slate-600 dark:bg-slate-400',
  },
};

export const SiteAnnouncementDialog: React.FC<SiteAnnouncementDialogProps> = ({
  announcement,
  queuedAnnouncements,
  isPreview = false,
  remainingCount = 1,
  onClose,
}) => {
  const { setActiveView, markAnnouncementSeen } = useApp();
  const recordedImpressionRef = useRef<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const isClosing = closingId === announcement.id;

  const stack =
    isPreview || !queuedAnnouncements || queuedAnnouncements.length === 0
      ? [announcement]
      : queuedAnnouncements;

  const totalCount = isPreview ? 1 : Math.max(remainingCount, stack.length);
  const backCards = isPreview ? [] : stack.slice(1, 3);
  const hasNext = !isPreview && totalCount > 1;

  useEffect(() => {
    if (isPreview || !announcement?.id) return;
    const impressionKey = `${announcement.id}:${announcement.revision || 1}`;
    if (recordedImpressionRef.current === impressionKey) return;
    recordedImpressionRef.current = impressionKey;
    markAnnouncementSeen(announcement.id);
  }, [announcement?.id, announcement?.revision, isPreview, markAnnouncementSeen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const triggerClose = () => {
    if (closingId === announcement.id) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onClose();
      return;
    }

    setClosingId(announcement.id);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 150);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const meta = CATEGORY_COPY[announcement.category] || CATEGORY_COPY.feature;

  const displayTimestamp =
    announcement.activatedAt ||
    (announcement.enabled
      ? announcement.updatedAt || announcement.createdAt
      : new Date().toISOString());

  const formattedDate = new Date(displayTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleActionClick = () => {
    if (closingId === announcement.id) return;
    if (!isPreview && announcement.actionView) {
      setActiveView(announcement.actionView);
    }
    triggerClose();
  };

  return (
    <div
      onClick={triggerClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-announcement-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md ${
          backCards.length >= 2 ? 'mb-6' : backCards.length === 1 ? 'mb-3' : ''
        }`}
      >
        {/* Stacked backing cards rendered beneath the active dialog */}
        {backCards.length >= 2 && (
          <div
            aria-hidden="true"
            style={{
              transform: isClosing
                ? 'translateY(11px) scale(0.96)'
                : 'translateY(22px) scale(0.92)',
              transformOrigin: 'bottom center',
            }}
            className="pointer-events-none select-none absolute inset-0 z-0 rounded-2xl bg-slate-200 dark:bg-slate-800/75 border border-slate-300/90 dark:border-slate-700/70 shadow-lg transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          />
        )}

        {backCards.length >= 1 && (
          <div
            aria-hidden="true"
            style={{
              transform: isClosing
                ? 'translateY(0px) scale(1)'
                : 'translateY(11px) scale(0.96)',
              transformOrigin: 'bottom center',
            }}
            className={`pointer-events-none select-none absolute inset-0 z-10 rounded-2xl border shadow-xl transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              isClosing
                ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
            }`}
          />
        )}

        {/* Active Top Announcement Card */}
        <div
          key={announcement.id}
          style={{
            transform: isClosing
              ? hasNext
                ? 'translateY(-14px) scale(0.97)'
                : 'translateY(6px) scale(0.97)'
              : 'translateY(0px) scale(1)',
          }}
          className={`relative z-20 w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/20 overflow-hidden transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Main Editorial Content */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Top Eyebrow Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                <span className={meta.toneClass}>{meta.label}</span>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                <span className="tabular-nums">{formattedDate}</span>
                {isPreview && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-400 dark:text-slate-500">Preview</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={triggerClose}
                aria-label="Close update dialog"
                className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Headline & Prose */}
            <div className="space-y-2.5">
              <h2
                id="site-announcement-title"
                style={{ textWrap: 'balance' }}
                className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.25]"
              >
                {announcement.title}
              </h2>

              <p className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {announcement.summary}
              </p>
            </div>

            {/* Optional Bullet Highlights */}
            {Array.isArray(announcement.highlights) && announcement.highlights.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  What changed
                </div>
                <ul className="space-y-2">
                  {announcement.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-[13px] text-slate-700 dark:text-slate-200 leading-snug"
                    >
                      <Check className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clean Minimal Footer */}
          <div className="px-6 sm:px-7 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
              {hasNext
                ? `1 of ${totalCount} updates · ${announcement.createdByName}`
                : `Posted by ${announcement.createdByName}`}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {announcement.actionView && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{announcement.actionLabel || 'Open Section'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={triggerClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                {isPreview ? 'Close Preview' : hasNext ? 'Next Update' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
