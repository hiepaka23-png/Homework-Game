import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameSettings, GameMode, UpgradeOption, ShipType } from './types';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseMenu } from './components/PauseMenu';
import { GameOverMenu } from './components/GameOverMenu';
import { LevelUpModal } from './components/LevelUpModal';
import { Unlock } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [cheatToast, setCheatToast] = useState(false);
  const [unlockedShips, setUnlockedShips] = useState<ShipType[]>(() => {
    try {
      const saved = localStorage.getItem('unlocked_ships');
      return saved ? JSON.parse(saved) : ['classic'];
    } catch {
      return ['classic'];
    }
  });

  const [settings, setSettings] = useState<GameSettings>({
    controlType: 'keyboard',
    difficulty: 'normal',
    soundEnabled: true,
    volume: 0.3,
    shipType: 'classic',
  });

  // Dummy state to force React re-render on engine frame updates
  const [, setFrameTick] = useState(0);

  const unlockAllShips = useCallback(() => {
    const all: ShipType[] = ['classic', 'laser', 'spread', 'homing'];
    setUnlockedShips(all);
    try {
      localStorage.setItem('unlocked_ships', JSON.stringify(all));
    } catch {}
    setCheatToast(true);
    setTimeout(() => setCheatToast(false), 3500);
  }, []);

  const unlockNextShip = useCallback(() => {
    const all: ShipType[] = ['classic', 'laser', 'spread', 'homing'];
    setUnlockedShips((prev) => {
      const next = all.find((s) => !prev.includes(s));
      if (next) {
        const updated = [...prev, next];
        try {
          localStorage.setItem('unlocked_ships', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  }, []);

  const handleLevelUp = useCallback(() => {
    setIsLevelUp(true);
  }, []);

  const handleSelectUpgrade = (upgrade: UpgradeOption) => {
    if (!engineRef.current) return;
    engineRef.current.applyUpgrade(upgrade);
    setIsLevelUp(false);
    engineRef.current.start();
  };

  const handleStateChange = useCallback(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;

    if (engine.isLevelUpActive) {
      setIsLevelUp(true);
    } else if (engine.isGameOver) {
      setGameMode('gameover');
      setIsLevelUp(false);
    } else if (engine.isVictory) {
      setGameMode('victory');
      setIsLevelUp(false);
      unlockNextShip();
    } else if (engine.isPaused) {
      setGameMode('paused');
    } else {
      setGameMode('playing');
    }

    setFrameTick((prev) => (prev + 1) % 1000);
  }, [unlockNextShip]);

  // Initialize Game Engine on Canvas mount
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current, settings, handleStateChange, handleLevelUp);
    }
  }, [settings, handleStateChange, handleLevelUp]);

  // Update Settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (engineRef.current) {
      engineRef.current.updateSettings(newSettings);
    }
  };

  // Start Game from Main Menu
  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setGameMode('playing');
  };

  // Resume Game
  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
  };

  // Restart Game
  const handleRestartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.resetGame();
    setGameMode('playing');
  };

  // Exit to Main Menu
  const handleExitToMain = () => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setGameMode('menu');
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    const container = document.getElementById('game-wrapper');
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Global keydown handler for Fullscreen (F) & Cheat Code Unlock (P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF') {
        handleToggleFullscreen();
      } else if (e.code === 'KeyP' && gameMode === 'menu') {
        unlockAllShips();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, unlockAllShips]);

  return (
    <div className="w-screen h-screen space-bg flex items-center justify-center overflow-hidden font-sans p-2 relative">
      {/* Cheat Code Toast Banner */}
      {cheatToast && (
        <div className="absolute top-6 z-50 px-6 py-3 bg-amber-500/90 text-slate-950 font-black text-sm rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-300 flex items-center gap-2.5 animate-bounce">
          <Unlock className="w-5 h-5" /> 🔓 ĐÃ KÍCH HOẠT PHÍM P: ĐÃ MỞ KHÓA TẤT CẢ PHI THUYỀN!
        </div>
      )}

      {/* 16:9 Aspect Ratio Container */}
      <div
        id="game-wrapper"
        className="relative w-full max-w-[1280px] aspect-video bg-[#02040a] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(2,6,23,0.8)] border border-slate-800/80 flex items-center justify-center"
      >
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          width={1280}
          height={720}
          className="w-full h-full block object-contain"
        />

        {/* OVERLAYS & MENUS */}
        {gameMode === 'menu' && (
          <MainMenu
            settings={settings}
            unlockedShips={unlockedShips}
            onUnlockAll={unlockAllShips}
            onStartGame={handleStartGame}
            onUpdateSettings={handleUpdateSettings}
            onToggleFullscreen={handleToggleFullscreen}
          />
        )}

        {gameMode === 'playing' && engineRef.current && (
          <HUD
            engine={engineRef.current}
            onTogglePause={handleResumeGame}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleSound={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
          />
        )}

        {isLevelUp && engineRef.current && (
          <LevelUpModal
            level={engineRef.current.player.level}
            onSelectUpgrade={handleSelectUpgrade}
          />
        )}

        {gameMode === 'paused' && engineRef.current && (
          <PauseMenu
            settings={settings}
            onResume={handleResumeGame}
            onRestart={handleRestartGame}
            onExitToMain={handleExitToMain}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {(gameMode === 'gameover' || gameMode === 'victory') && engineRef.current && (
          <GameOverMenu
            isVictory={gameMode === 'victory'}
            stats={engineRef.current.stats}
            onRestart={handleRestartGame}
            onExitToMain={handleExitToMain}
          />
        )}
      </div>
    </div>
  );
}
