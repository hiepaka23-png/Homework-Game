import React from 'react';
import { GameEngine } from '../game/engine';
import { Shield, Zap, Heart, Globe, Crosshair, Volume2, VolumeX, Maximize2, Rocket, Wind, Bot, Flame, Droplet } from 'lucide-react';
import { LEVEL_CONFIGS } from '../game/levels';

interface HUDProps {
  engine: GameEngine;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onToggleSound: () => void;
}

export const HUD: React.FC<HUDProps> = ({ engine, onTogglePause, onToggleFullscreen, onToggleSound }) => {
  const { player, earthHp, maxEarthHp, score, level, bossProgress, boss, isBossActive } = engine;
  const levelInfo = LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];

  const shieldPercent = player.shieldActive
    ? (player.shieldTimer / 240) * 100
    : player.shieldCooldown > 0
    ? ((360 - player.shieldCooldown) / 360) * 100
    : 100;

  const dashPercent = player.isDashing
    ? (player.dashTimer / 16) * 100
    : player.dashCooldown > 0
    ? ((90 - player.dashCooldown) / 90) * 100
    : 100;

  const weaponNames = [
    '1x Pháo Tiêu Chuẩn Mk.I',
    '2x Pháo Đôi Tăng Cường Mk.II',
    '3x Bão Đạn Chùm Mk.III',
    '4x Pháo Laser Xuyên Lực',
    '5x Bão Lửa & Hố Đen Tối Thượng',
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 font-sans select-none">
      {/* TOP HUD BAR */}
      <div className="flex items-start justify-between w-full gap-4">
        {/* Left HUD Panel */}
        <div className="hud-glass p-3.5 rounded-xl flex items-center gap-4 text-white shadow-xl min-w-[220px]">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Điểm Số Chiến Đấu</div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono tracking-tight">{score.toLocaleString().padStart(6, '0')}</div>
          </div>

          <div className="h-9 w-px bg-slate-700/80" />

          <div>
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">
              <span>CẤP {player.level} EXP</span>
              <span className="text-cyan-400 font-mono text-[10px]">
                {Math.floor(player.exp)}/{player.maxExp}
              </span>
            </div>
            <div className="w-28 h-2 bg-slate-950 rounded-full border border-slate-700/80 overflow-hidden p-0.5 mb-1.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-200 shadow-[0_0_8px_#22d3ee]"
                style={{ width: `${Math.min(100, (player.exp / player.maxExp) * 100)}%` }}
              />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border transition-all ${
                    i < player.lives
                      ? 'bg-rose-500 border-rose-300 shadow-[0_0_8px_#f43f5e]'
                      : 'bg-slate-800 border-slate-700 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Boss / Progress Monitor */}
        <div className="flex flex-col items-center min-w-[340px] max-w-[500px] w-full pt-1">
          {isBossActive && boss ? (
            <div className="w-full flex flex-col items-center">
              <div className="text-rose-500 font-black tracking-widest text-sm animate-pulse mb-1 flex items-center gap-1.5 uppercase">
                <span>⚠️ TRÙM VŨ TRỤ:</span> <span>{boss.name}</span>
              </div>
              <div className="w-full h-4 bg-slate-950 border border-rose-500/80 rounded-full overflow-hidden p-0.5 shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 rounded-full transition-all duration-150 shadow-[0_0_10px_#f43f5e]"
                  style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="text-xs font-bold text-slate-300 tracking-wider mb-1 flex justify-between w-full">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest">Tiến Trình Màn Chiến Đấu</span>
                <span className="text-cyan-400 font-mono">{Math.floor(bossProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 border border-slate-700/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_10px_#22d3ee]"
                  style={{ width: `${bossProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Combo Streak Banner */}
          {engine.comboCount >= 3 && (
            <div className="mt-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-amber-400/80 text-amber-300 font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-bounce">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-400" />
              <span>COMBO x{engine.comboCount}! (+{Math.min(150, Math.floor(engine.comboCount / 5) * 10)}% SÁT THƯƠNG)</span>
            </div>
          )}
        </div>

        {/* Right HUD Panel: Longer Health Bars Without Numbers */}
        <div className="hud-glass p-3.5 rounded-xl flex items-center gap-5 text-white shadow-xl">
          {/* Player Ship HP (Longer bar, no numbers) */}
          <div className="w-44 sm:w-56">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-300 mb-1">
              <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-cyan-400" /> MÁU PHI THUYỀN</span>
              {player.lifestealPercent > 0 && (
                <span className="text-[10px] text-rose-400 font-extrabold flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 px-1.5 py-0.5 rounded-full">
                  <Droplet className="w-2.5 h-2.5 text-rose-400 fill-rose-400" /> HÚT MÁU {player.lifestealPercent}%
                </span>
              )}
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  player.hp < 30 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_#0ea5e9]'
                }`}
                style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Earth Integrity HP (Longer bar, no numbers) */}
          <div className="w-44 sm:w-56">
            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-300 mb-1">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-indigo-400" /> MÁU TRÁI ĐẤT</span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-700 overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  earthHp < 30
                    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_10px_#6366f1]'
                }`}
                style={{ width: `${Math.max(0, (earthHp / maxEarthHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Quick HUD Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto pl-1 border-l border-slate-700/80">
            <button
              onClick={onToggleSound}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-600/80 cursor-pointer"
              title="Tắt / Mở Âm Thanh (M)"
            >
              {engine.settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-600/80 cursor-pointer"
              title="Toàn Màn Hình (F)"
            >
              <Maximize2 className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD BAR */}
      <div className="flex items-end justify-between w-full">
        {/* Left Skill Key Badges */}
        <div className="flex items-center gap-3">
          {/* Dash Skill Space */}
          <div className="relative w-16 h-14 hud-glass rounded-xl flex flex-col items-center justify-center border-t-2 border-t-cyan-400 shadow-lg">
            <Wind className={`w-5 h-5 ${player.isDashing ? 'text-cyan-300 animate-spin' : player.dashCooldown <= 0 ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[9px] uppercase font-black text-slate-300 mt-0.5">LƯỚT [SPACE]</span>

            {!player.isDashing && player.dashCooldown > 0 && (
              <div
                className="absolute inset-0 bg-slate-950/85 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-cyan-300"
                style={{ clipPath: `inset(0 0 ${dashPercent}% 0)` }}
              >
                {(player.dashCooldown / 60).toFixed(1)}s
              </div>
            )}
          </div>

          {/* Shield Skill Q */}
          <div className="relative w-14 h-14 hud-glass rounded-xl flex flex-col items-center justify-center border-t-2 border-t-emerald-400 shadow-lg">
            <Shield className={`w-5 h-5 ${player.shieldActive ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
            <span className="text-[9px] uppercase font-black text-slate-300 mt-0.5">KHIÊN [Q]</span>

            {!player.shieldActive && player.shieldCooldown > 0 && (
              <div
                className="absolute inset-0 bg-slate-950/85 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-amber-400"
                style={{ clipPath: `inset(0 0 ${shieldPercent}% 0)` }}
              >
                {Math.ceil(player.shieldCooldown / 60)}s
              </div>
            )}
          </div>

          {/* Burst Skill E */}
          <div className="relative w-14 h-14 hud-glass rounded-xl flex flex-col items-center justify-center border-t-2 border-t-amber-400 shadow-lg overflow-hidden">
            <Zap className={`w-5 h-5 ${player.specialEnergy >= 100 ? 'text-amber-300 animate-bounce' : 'text-amber-400/80'}`} />
            <span className="text-[9px] uppercase font-black text-slate-300 mt-0.5">TUYỆT CHIÊU [E]</span>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-950">
              <div
                className="h-full bg-amber-400 transition-all duration-150 shadow-[0_0_8px_#fbbf24]"
                style={{ width: `${player.specialEnergy}%` }}
              />
            </div>
          </div>

          {/* Homing Missile Skill R */}
          <div className="relative w-14 h-14 hud-glass rounded-xl flex flex-col items-center justify-center border-t-2 border-t-rose-500 shadow-lg overflow-hidden">
            <Rocket className={`w-5 h-5 ${player.missileCooldown <= 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[9px] uppercase font-black text-slate-300 mt-0.5">TÊN LỬA [R]</span>

            {player.missileCooldown > 0 && (
              <div
                className="absolute inset-0 bg-slate-950/85 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-rose-400"
                style={{ clipPath: `inset(0 0 ${((300 - player.missileCooldown) / 300) * 100}% 0)` }}
              >
                {Math.ceil(player.missileCooldown / 60)}s
              </div>
            )}
          </div>

          {/* Satellite Drone Active Badge */}
          {player.droneCount > 0 && (
            <div className="px-3 py-2 hud-glass rounded-xl border border-purple-500/40 text-purple-300 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>VỆ TINH: {player.droneCount}</span>
            </div>
          )}
        </div>

        {/* Center Weapon Badge */}
        <div className="hud-glass px-5 py-2 rounded-xl flex items-center gap-3 shadow-xl border-t-2 border-t-amber-400">
          <Crosshair className="w-5 h-5 text-amber-400" />
          <div className="text-left">
            <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Loại Đạn Vũ Khí</div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider">{weaponNames[player.bulletLevel - 1]}</div>
          </div>
        </div>

        {/* Right Controls Quick Hints */}
        <div className="text-right text-[11px] text-slate-300 hud-glass px-3.5 py-2 rounded-xl border border-slate-700/80">
          <div><span className="text-cyan-300 font-black">WASD / Mũi Tên</span>: Di chuyển</div>
          <div><span className="text-cyan-300 font-black">SPACE</span>: Lướt Né Tàng Hình | <span className="text-cyan-300 font-black">Chuột Trái</span>: Bắn</div>
        </div>
      </div>
    </div>
  );
};
