import React from 'react';
import { GameStats } from '../types';
import { RotateCcw, Home, Trophy, Skull, Target, Flame } from 'lucide-react';

interface GameOverMenuProps {
  isVictory: boolean;
  stats: GameStats;
  onRestart: () => void;
  onExitToMain: () => void;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({
  isVictory,
  stats,
  onRestart,
  onExitToMain,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-white select-none z-50">
      <div className="max-w-md w-full hud-glass border border-slate-700/80 rounded-3xl p-8 shadow-2xl text-center">
        {/* Header Icon & Title */}
        <div className="mb-6">
          <div className="inline-flex p-3 rounded-2xl mb-3 bg-slate-950/80 border border-slate-800">
            {isVictory ? (
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce shadow-[0_0_15px_#fbbf24]" />
            ) : (
              <Skull className="w-10 h-10 text-rose-500 shadow-[0_0_15px_#f43f5e]" />
            )}
          </div>

          <h2
            className={`text-2xl font-black tracking-wide ${
              isVictory ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]' : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]'
            }`}
          >
            {isVictory ? 'VICTORY! BẢO VỆ TRÁI ĐẤT THÀNH CÔNG' : 'TRÁI ĐẤT ĐÃ BỊ HỦY DIỆT'}
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            {isVictory
              ? 'Bạn đã đánh bại UFO Emperor và cứu Trái Đất khỏi thảm họa!'
              : 'Trái Đất đã chịu quá nhiều tổn thất trước cuộc xâm lược.'}
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-6 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-400" /> TỔNG ĐIỂM</span>
            <span className="text-amber-400 font-mono text-base font-extrabold">{stats.score.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">MÀN ĐẠT ĐƯỢC</span>
            <span className="text-cyan-300 font-bold">Màn {stats.level} / 5</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-rose-400" /> THIÊN THẠCH TIÊU DIỆT</span>
            <span className="text-slate-200 font-bold">{stats.meteorsDestroyed}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">UFO TIÊU DIỆT</span>
            <span className="text-slate-200 font-bold">{stats.ufosDestroyed}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-400" /> BOSS ĐÃ HẠ</span>
            <span className="text-amber-300 font-bold">{stats.bossesDefeated} Boss</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> CHƠI LẠI NGAY
          </button>

          <button
            onClick={onExitToMain}
            className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> VỀ MENU CHÍNH
          </button>
        </div>
      </div>
    </div>
  );
};
