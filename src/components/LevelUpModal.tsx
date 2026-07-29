import React, { useMemo } from 'react';
import { UpgradeOption, UPGRADE_POOL, DRONE_UPGRADE } from '../types';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  onSelectUpgrade: (upgrade: UpgradeOption) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, onSelectUpgrade }) => {
  // Randomly select 3 unique options with high priority for Lifesteal (~75% chance) and Satellite Drone (~35% chance)
  const choices = useMemo(() => {
    const lifestealOption = UPGRADE_POOL.find((u) => u.id === 'lifesteal')!;
    const otherPool = UPGRADE_POOL.filter((u) => u.id !== 'lifesteal');

    const includeLifesteal = Math.random() < 0.75; // High 75% chance to offer Lifesteal
    const includeDrone = Math.random() < 0.35; // ~35% chance to offer Satellite Drone

    const selected: UpgradeOption[] = [];

    if (includeLifesteal) {
      selected.push(lifestealOption);
    }

    if (includeDrone && selected.length < 3) {
      selected.push(DRONE_UPGRADE);
    }

    const shuffledOther = [...otherPool].sort(() => Math.random() - 0.5);
    for (const option of shuffledOther) {
      if (selected.length >= 3) break;
      if (!selected.some((s) => s.id === option.id)) {
        selected.push(option);
      }
    }

    // Shuffle result so card position is randomized
    return selected.sort(() => Math.random() - 0.5);
  }, [level]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-[0_0_50px_rgba(56,189,248,0.2)] text-center relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#38bdf8]" />

        {/* Level Up Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-400/40 rounded-full text-cyan-300 text-xs font-black uppercase tracking-widest mb-3 animate-pulse">
          <Sparkles className="w-4 h-4 text-cyan-400" /> THĂNG CẤP PHI THUYỀN (LEVEL {level})
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">CHỌN PHẦN THƯỞNG TĂNG CƯỜNG</h2>
        <p className="text-slate-400 text-xs sm:text-sm mb-6">
          Chọn 1 chỉ số để nâng cấp lập tức sức mạnh chiến đấu cho phi thuyền!
        </p>

        {/* Upgrade Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {choices.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectUpgrade(option)}
              className="group p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border-2 border-slate-800 hover:border-cyan-400 transition-all flex flex-col items-center text-center cursor-pointer shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-slate-700/80 shadow-inner group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${option.color}15`, borderColor: option.color }}
              >
                {option.icon}
              </div>

              {/* Title */}
              <h3 className="text-sm font-black text-white group-hover:text-cyan-300 mb-2 leading-tight">
                {option.title}
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-xs leading-relaxed mb-4">{option.description}</p>

              {/* Select Tag */}
              <div className="mt-auto px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-colors flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> NÂNG CẤP
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
