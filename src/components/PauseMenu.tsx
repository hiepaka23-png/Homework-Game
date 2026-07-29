import React from 'react';
import { GameSettings } from '../types';
import { Play, RotateCcw, Home, Volume2, VolumeX, Keyboard, MousePointer } from 'lucide-react';

interface PauseMenuProps {
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onExitToMain: () => void;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  settings,
  onResume,
  onRestart,
  onExitToMain,
  onUpdateSettings,
}) => {
  const toggleSound = () => {
    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const toggleControl = () => {
    onUpdateSettings({
      ...settings,
      controlType: settings.controlType === 'keyboard' ? 'mouse' : 'keyboard',
    });
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white select-none z-50">
      <div className="max-w-md w-full hud-glass border border-slate-700/80 rounded-3xl p-8 shadow-2xl text-center">
        <h2 className="text-3xl font-black text-cyan-400 mb-6 tracking-widest drop-shadow-[0_0_15px_rgba(14,165,233,0.4)]">
          TẠM DỪNG GAME
        </h2>

        <div className="space-y-3 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> TIẾP TỤC CHƠI
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer hover:border-amber-400/50"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" /> CHƠI LẠI MÀN NÀY
          </button>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={toggleControl}
              className="py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {settings.controlType === 'keyboard' ? <Keyboard className="w-4 h-4 text-cyan-400" /> : <MousePointer className="w-4 h-4 text-cyan-400" />}
              {settings.controlType === 'keyboard' ? 'WASD' : 'CHUỘT'}
            </button>

            <button
              onClick={toggleSound}
              className="py-2.5 px-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              {settings.soundEnabled ? 'ÂM BẬT' : 'ÂM TẮT'}
            </button>
          </div>
        </div>

        <button
          onClick={onExitToMain}
          className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" /> VỀ MENU CHÍNH
        </button>
      </div>
    </div>
  );
};
