import React from 'react';
import {
  useAdminCategoriesQuery,
  useAdminToggleCategoryMutation,
} from '../../hooks/queries';
import { triggerHaptic } from '../../services/telegram';
import { Sliders, CheckCircle2, XCircle, Info } from 'lucide-react';

const CATEGORY_META = {
  daily: {
    title: 'Daily Check-in & Ad Quests',
    desc: 'Daily login calendar streak and rewarded Adsgram ad watch tasks.',
  },
  social: {
    title: 'Social & Telegram Community',
    desc: 'Official channel subscription, group join, and social media quests.',
  },
  partner: {
    title: 'Partner Sponsored Tasks',
    desc: 'Sponsored quests from external advertising partners and airdrops.',
  },
  app_tasks: {
    title: 'App Tasks & TMA Level Verifications',
    desc: 'Playing partner Mini Apps, downloading apps, or reaching specified game levels.',
  },
  exclusive: {
    title: 'Exclusive Special Quests',
    desc: 'High-reward limited-time promotional tasks and bonus campaigns.',
  },
};

export default function AdminCategoriesPage() {
  const { data, isLoading } = useAdminCategoriesQuery();
  const toggleMutation = useAdminToggleCategoryMutation();

  const categories = data?.categories || {
    daily: true,
    social: true,
    partner: true,
    app_tasks: true,
    exclusive: true,
  };

  const handleToggle = async (catKey, currentStatus) => {
    triggerHaptic('medium');
    await toggleMutation.mutateAsync({
      category: catKey,
      enabled: !currentStatus,
    });
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3.5 flex items-start gap-2.5 text-blue-300 text-xs">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Disabling any category will immediately hide all tasks in that category as well as the category button from
          every player's Tasks tab in real-time.
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-500 font-mono text-xs animate-pulse">
          Loading category controls...
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const isEnabled = categories[key] !== false;

            return (
              <div
                key={key}
                className="rounded-3xl bg-[#14141c] border border-white/5 p-4 flex items-center justify-between gap-4 transition-all hover:border-white/15"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{meta.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isEnabled
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{meta.desc}</p>
                </div>

                {/* TOGGLE SWITCH */}
                <button
                  type="button"
                  onClick={() => handleToggle(key, isEnabled)}
                  disabled={toggleMutation.isPending}
                  className={`w-14 h-8 rounded-full p-1 transition-colors relative flex-shrink-0 ${
                    isEnabled ? 'bg-green-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
