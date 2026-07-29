import React, { useState } from 'react';
import { GameSettings, Difficulty, SHIP_CONFIGS, ShipType } from '../types';
import { Play, Settings, BookOpen, Shield, Volume2, VolumeX, Maximize2, MousePointer, Keyboard, Trophy, Rocket } from 'lucide-react';
import { ShipSelectModal } from './ShipSelectModal';

interface MainMenuProps {
  settings: GameSettings;
  unlockedShips?: ShipType[];
  onUnlockAll?: () => void;
  onStartGame: () => void;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onToggleFullscreen: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  settings,
  unlockedShips,
  onUnlockAll,
  onStartGame,
  onUpdateSettings,
  onToggleFullscreen,
}) => {
  const [activeModal, setActiveModal] = useState<'settings' | 'tutorial' | 'difficulty' | 'shipSelect' | null>(null);

  const currentShip = SHIP_CONFIGS[settings.shipType || 'classic'];

  const setControlMode = (mode: 'keyboard' | 'mouse') => {
    onUpdateSettings({ ...settings, controlType: mode });
  };

  const setDifficultyMode = (diff: Difficulty) => {
    onUpdateSettings({ ...settings, difficulty: diff });
    setActiveModal(null);
  };

  const toggleSound = () => {
    onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white select-none z-50">
      {/* Background Decorative Glow */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Menu Box */}
      <div className="relative z-10 max-w-lg w-full hud-glass rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center border border-slate-700/60">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-block px-3.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[11px] font-bold uppercase tracking-widest mb-3">
            PC Space Shooter Game
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            EARTH DEFENDER
          </h1>
          <h2 className="text-base font-extrabold text-rose-500 tracking-[0.2em] mt-1.5 uppercase">METEOR INVASION</h2>
        </div>

        {/* Selected Ship Preview Box */}
        <div
          onClick={() => setActiveModal('shipSelect')}
          className="w-full mb-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400/80 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-slate-800 border border-slate-700 group-hover:scale-105 transition-transform">
              {currentShip.icon}
            </span>
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phi thuyền đang chọn</div>
              <div className="text-sm font-black text-cyan-300">{currentShip.name}</div>
              <div className="text-[11px] text-slate-300 font-medium">{currentShip.tagline}</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
            ĐỔI
          </span>
        </div>

        {/* Menu Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onStartGame}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg rounded-2xl shadow-lg shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" /> CHƠI NGAY
          </button>

          <button
            onClick={() => setActiveModal('shipSelect')}
            className="w-full py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-cyan-300 font-bold text-xs tracking-wider rounded-xl border border-cyan-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-cyan-400 shadow-md"
          >
            <Rocket className="w-4 h-4 text-cyan-400" /> CHỌN PHI THUYỀN CHIẾN ĐẤU
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal('difficulty')}
              className="py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-amber-400/50"
            >
              <Trophy className="w-4 h-4 text-amber-400" /> ĐỘ KHÓ ({settings.difficulty.toUpperCase()})
            </button>

            <button
              onClick={() => setActiveModal('settings')}
              className="py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-cyan-400/50"
            >
              <Settings className="w-4 h-4 text-cyan-400" /> CÀI ĐẶT
            </button>
          </div>

          <button
            onClick={() => setActiveModal('tutorial')}
            className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs tracking-wider rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-indigo-400/50"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" /> HƯỚNG DẪN ĐIỀU KHIỂN
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={toggleSound}
              className="flex-1 py-2.5 mr-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              {settings.soundEnabled ? 'ÂM THANH: BẬT' : 'ÂM THANH: TẮT'}
            </button>

            <button
              onClick={onToggleFullscreen}
              className="py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4 text-cyan-400" /> TOÀN MÀN HÌNH (F)
            </button>
          </div>
        </div>
      </div>

      {/* SHIP SELECT MODAL */}
      {activeModal === 'shipSelect' && (
        <ShipSelectModal
          settings={settings}
          unlockedShips={unlockedShips}
          onUnlockAll={onUnlockAll}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* SETTINGS MODAL */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> CÀI ĐẶT ĐIỀU KHIỂN
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Chế độ điều khiển phi thuyền</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setControlMode('keyboard')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-sm font-bold transition-all ${
                      settings.controlType === 'keyboard'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Keyboard className="w-6 h-6" /> BÀN PHÍM (WASD)
                  </button>

                  <button
                    onClick={() => setControlMode('mouse')}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-sm font-bold transition-all ${
                      settings.controlType === 'mouse'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MousePointer className="w-6 h-6" /> CHUỘT
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}

      {/* DIFFICULTY MODAL */}
      {activeModal === 'difficulty' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" /> CHỌN ĐỘ KHÓ
            </h3>

            <div className="space-y-3 mb-6">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyMode(d)}
                  className={`w-full py-3 px-4 rounded-xl border font-bold text-sm transition-all text-left flex items-center justify-between ${
                    settings.difficulty === d
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>
                    {d === 'easy' && 'DỄ (Tăng lượng item xuất hiện)'}
                    {d === 'normal' && 'BÌNH THƯỜNG (Cân bằng tiêu chuẩn)'}
                    {d === 'hard' && 'KHÓ (Meteors & UFOs nhanh hơn)'}
                  </span>
                  {settings.difficulty === d && <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">ĐANG CHỌN</span>}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}

      {/* TUTORIAL MODAL */}
      {activeModal === 'tutorial' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> HƯỚNG DẪN CHƠI GAME
            </h3>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-cyan-300 mb-2">🕹️ PHÍM ĐIỀU KHIỂN BÀN PHÍM:</div>
                <ul className="grid grid-cols-2 gap-2 text-slate-300">
                  <li>• <span className="text-amber-300 font-bold">WASD / Mũi Tên</span>: Di chuyển phi thuyền</li>
                  <li>• <span className="text-amber-300 font-bold">Space / Chuột Trái</span>: Bắn đạn liên tục</li>
                  <li>• <span className="text-amber-300 font-bold">Phím Q</span>: Kích hoạt Khiên Năng Lượng</li>
                  <li>• <span className="text-amber-300 font-bold">Phím E</span>: Tuyệt Chiêu Bão Năng Lượng</li>
                  <li>• <span className="text-amber-300 font-bold">Phím Shift</span>: Tăng tốc cực đại</li>
                  <li>• <span className="text-amber-300 font-bold">Phím P / Esc</span>: Tạm dừng trò chơi</li>
                  <li>• <span className="text-amber-300 font-bold">Phím F</span>: Toàn màn hình</li>
                  <li>• <span className="text-amber-300 font-bold">Phím M</span>: Bật / Tắt âm thanh</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-cyan-300 mb-2">⚡ 5 CẤP ĐỘ ĐẠN PHI THUYỀN:</div>
                <ol className="space-y-1 list-decimal list-inside text-slate-300">
                  <li><span className="font-bold text-amber-300">Cấp 1: Đạn Đơn</span> - Đạn năng lượng cơ bản.</li>
                  <li><span className="font-bold text-amber-300">Cấp 2: Đạn Đôi</span> - Bắn song song 2 luồng đạn.</li>
                  <li><span className="font-bold text-amber-300">Cấp 3: Đạn 3 Hướng</span> - Tỏa rộng tiêu diệt nhóm thiên thạch.</li>
                  <li><span className="font-bold text-amber-300">Cấp 4: Laser Xuyên</span> - Tia laser đâm xuyên qua nhiều mục tiêu.</li>
                  <li><span className="font-bold text-amber-300">Cấp 5: Khẩu Plasma</span> - Quả cầu Plasma nổ gây sát thương diện rộng.</li>
                </ol>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-bold text-cyan-300 mb-2">🛡️ VẬT PHẨM POWER-UP RƠI RA:</div>
                <p>Tiêu diệt thiên thạch & UFO để nhặt vật phẩm: Nâng cấp đạn ⚡, Hồi máu phi thuyền ❤️, Hồi máu Trái Đất 🌍, Tăng tốc bắn 🔥, Nạp khiên 🛡️, Nạp tuyệt chiêu 🌟.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
