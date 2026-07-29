import React from 'react';
import { ShipType, SHIP_CONFIGS, GameSettings } from '../types';
import { Rocket, ShieldCheck, Zap, Flame, ChevronRight, X, Lock, Unlock } from 'lucide-react';

interface ShipSelectModalProps {
  settings: GameSettings;
  unlockedShips?: ShipType[];
  onUnlockAll?: () => void;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const ShipSelectModal: React.FC<ShipSelectModalProps> = ({
  settings,
  unlockedShips = ['classic', 'laser', 'spread', 'homing'],
  onUnlockAll,
  onUpdateSettings,
  onClose,
}) => {
  const ships = Object.values(SHIP_CONFIGS);

  const handleSelectShip = (shipType: ShipType, isUnlocked: boolean) => {
    if (!isUnlocked) {
      if (onUnlockAll) {
        onUnlockAll();
        onUpdateSettings({ ...settings, shipType });
      }
      return;
    }
    onUpdateSettings({ ...settings, shipType });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">
            <Rocket className="w-4 h-4" /> TRẠM CHỌN PHI THUYỀN
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">LỰA CHỌN PHI THUYỀN CHIẾN ĐẤU</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Hoàn thành 1 ván chơi để tự động mở khóa các phi thuyền chiến đấu tiếp theo!
          </p>
        </div>

        {/* Ship Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {ships.map((ship) => {
            const isSelected = settings.shipType === ship.id;
            const isUnlocked = unlockedShips.includes(ship.id);

            return (
              <div
                key={ship.id}
                onClick={() => handleSelectShip(ship.id, isUnlocked)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  !isUnlocked
                    ? 'bg-slate-950/90 border-slate-800 opacity-80 hover:border-amber-500/60'
                    : isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900/80'
                }`}
              >
                {/* Background glow accent */}
                <div
                  className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
                  style={{ backgroundColor: ship.color }}
                />

                {/* Lock Overlay if locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
                    <span className="text-sm font-black text-amber-300 uppercase tracking-wide">CHƯA MỞ KHÓA</span>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                      Hoàn thành 1 game chiến đấu để mở khóa phi thuyền này!
                    </p>
                  </div>
                )}

                {isSelected && isUnlocked && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-cyan-500 text-slate-950 text-[10px] font-black uppercase rounded-full flex items-center gap-1 shadow-md z-10">
                    <ShieldCheck className="w-3.5 h-3.5" /> ĐANG CHỌN
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
                      {ship.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-wide" style={{ color: isSelected ? ship.color : '#ffffff' }}>
                        {ship.name}
                      </h3>
                      <p className="text-xs font-semibold text-cyan-400">{ship.tagline}</p>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed mb-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    {ship.description}
                  </p>
                </div>

                {/* Stats Bars */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {/* Speed */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Rocket className="w-3 h-3 text-cyan-400" /> Tốc độ
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-4 h-1.5 rounded-full ${
                            level <= ship.statSpeed ? 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Power */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Sát thương
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-4 h-1.5 rounded-full ${
                            level <= ship.statPower ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fire Rate */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" /> Tốc độ bắn
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-4 h-1.5 rounded-full ${
                            level <= ship.statFireRate ? 'bg-rose-400 shadow-[0_0_6px_#fb7185]' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            XÁC NHẬN CHỌN PHI THUYỀN <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
