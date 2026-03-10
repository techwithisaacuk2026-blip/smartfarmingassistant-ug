import { useState, useRef, useCallback, useEffect } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useGameAudio } from "@/hooks/useGameAudio";
import { Music, Play, RotateCcw, Home, Volume2, VolumeX, Settings, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Screen = "home" | "game" | "gameover" | "music" | "settings";

const LS_KEY = "beatbounce_highscore";
const LS_MUSIC_KEY = "beatbounce_music";

function getHighScore(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) || "0", 10); } catch { return 0; }
}
function setHighScore(v: number) {
  localStorage.setItem(LS_KEY, String(v));
}
function getMusicEnabled(): boolean {
  try { return localStorage.getItem(LS_MUSIC_KEY) !== "false"; } catch { return true; }
}

const Game = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [score, setScore] = useState(0);
  const [highScore, setHigh] = useState(getHighScore);
  const [musicOn, setMusicOn] = useState(getMusicEnabled);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scoreRef = useRef(0);

  const audio = useGameAudio();

  const handleScore = useCallback(() => {
    scoreRef.current += 1;
    setScore(scoreRef.current);
  }, []);

  const handleGameOver = useCallback(() => {
    audio.stopMusic();
    audio.playGameOverSound();
    const final = scoreRef.current;
    if (final > getHighScore()) {
      setHighScore(final);
      setHigh(final);
    }
    setScreen("gameover");
  }, [audio]);

  const handleLand = useCallback(() => {
    audio.playLandSound();
  }, [audio]);

  const { start, stop, jump, CANVAS_W, CANVAS_H } = useGameEngine(canvasRef, handleScore, handleGameOver, handleLand);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    setScreen("game");
    setTimeout(() => {
      start();
      if (musicOn) audio.startMusic();
    }, 100);
  }, [start, audio, musicOn]);

  const handleJump = useCallback(() => {
    jump();
    audio.playJumpSound();
  }, [jump, audio]);

  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    localStorage.setItem(LS_MUSIC_KEY, String(next));
    audio.setEnabled(next);
  }, [musicOn, audio]);

  const resetHighScore = useCallback(() => {
    setHighScore(0);
    setHigh(0);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && screen === "game") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, handleJump]);

  // Stop game on unmount
  useEffect(() => {
    return () => { stop(); audio.stopMusic(); };
  }, [stop, audio]);

  // Shared wrapper
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      <div className="w-full max-w-[420px]">
        {children}
      </div>
    </div>
  );

  // HOME SCREEN
  if (screen === "home") {
    return (
      <Wrapper>
        <div className="text-center space-y-8 animate-fade-in">
          {/* Title */}
          <div className="space-y-2">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #ff6b6b, #ee5a24)" }}>
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Beat Bounce
            </h1>
            <p className="text-sm" style={{ color: "#00d2ff" }}>Tap to jump · Land on platforms · Beat your score</p>
          </div>

          {/* High Score */}
          <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl mx-auto w-fit"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Trophy className="w-5 h-5" style={{ color: "#ffd700" }} />
            <span className="text-white font-bold text-lg">{highScore}</span>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button onClick={startGame}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #ff6b6b, #ee5a24)" }}>
              <Play className="w-6 h-6" /> Play
            </button>

            <div className="flex gap-3">
              <button onClick={() => setScreen("music")}
                className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Music className="w-5 h-5" /> Music
              </button>
              <button onClick={() => setScreen("settings")}
                className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Settings className="w-5 h-5" /> Settings
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Created by Kazibwe Isaac · Uganda
          </p>
        </div>
      </Wrapper>
    );
  }

  // GAME SCREEN
  if (screen === "game") {
    return (
      <Wrapper>
        <div className="text-center">
          {/* Score HUD */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-white font-bold text-xl">Score: {score}</span>
            <button onClick={() => { stop(); audio.stopMusic(); setScreen("home"); }}
              className="p-2 rounded-lg active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <Home className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-2xl touch-none"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}`, maxWidth: CANVAS_W, margin: "0 auto", border: "2px solid rgba(0,210,255,0.2)" }}
            onClick={handleJump}
            onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
          />

          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Tap screen or press Space to jump
          </p>
        </div>
      </Wrapper>
    );
  }

  // GAME OVER SCREEN
  if (screen === "gameover") {
    const isNewHigh = score >= highScore && score > 0;
    return (
      <Wrapper>
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-3xl font-extrabold text-white">Game Over</h2>

          <div className="space-y-3">
            <div className="py-4 px-6 rounded-xl mx-auto w-fit"
              style={{ background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)" }}>
              <p className="text-sm" style={{ color: "#ff6b6b" }}>Final Score</p>
              <p className="text-5xl font-extrabold text-white">{score}</p>
            </div>

            {isNewHigh && (
              <p className="text-sm font-bold animate-pulse" style={{ color: "#ffd700" }}>
                🎉 New High Score!
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Trophy className="w-4 h-4" style={{ color: "#ffd700" }} />
              Best: {highScore}
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={startGame}
              className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #ff6b6b, #ee5a24)" }}>
              <RotateCcw className="w-5 h-5" /> Retry
            </button>
            <button onClick={() => setScreen("home")}
              className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <Home className="w-5 h-5" /> Home
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  // MUSIC SCREEN
  if (screen === "music") {
    return (
      <Wrapper>
        <div className="text-center space-y-6 animate-fade-in">
          <button onClick={() => setScreen("home")} className="text-white/50 text-sm flex items-center gap-1 hover:text-white transition-colors">
            ← Back
          </button>
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00d2ff, #3a7bd5)" }}>
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Music</h2>

          <div className="p-4 rounded-xl space-y-4"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-white font-medium">Chiptune Melody</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Default game track</p>
              </div>
              <div className="flex items-center gap-2">
                {musicOn ? (
                  <Volume2 className="w-5 h-5" style={{ color: "#00d2ff" }} />
                ) : (
                  <VolumeX className="w-5 h-5 text-white/30" />
                )}
              </div>
            </div>

            <button onClick={toggleMusic}
              className="w-full py-3 rounded-lg text-white font-medium active:scale-95 transition-transform"
              style={{ background: musicOn ? "rgba(255,107,107,0.2)" : "rgba(0,210,255,0.2)" }}>
              {musicOn ? "Mute Music" : "Enable Music"}
            </button>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Music is generated using Web Audio API — no files needed!
          </p>
        </div>
      </Wrapper>
    );
  }

  // SETTINGS SCREEN
  return (
    <Wrapper>
      <div className="text-center space-y-6 animate-fade-in">
        <button onClick={() => setScreen("home")} className="text-white/50 text-sm flex items-center gap-1 hover:text-white transition-colors">
          ← Back
        </button>
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #a55eea, #8854d0)" }}>
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>

        <div className="space-y-3">
          {/* Music toggle */}
          <div className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3">
              {musicOn ? <Volume2 className="w-5 h-5" style={{ color: "#00d2ff" }} /> : <VolumeX className="w-5 h-5 text-white/30" />}
              <span className="text-white font-medium">Music</span>
            </div>
            <button onClick={toggleMusic}
              className="w-12 h-7 rounded-full relative transition-colors"
              style={{ background: musicOn ? "#00d2ff" : "rgba(255,255,255,0.15)" }}>
              <div className="w-5 h-5 bg-white rounded-full absolute top-1 transition-all"
                style={{ left: musicOn ? "calc(100% - 24px)" : "4px" }} />
            </button>
          </div>

          {/* Reset high score */}
          <div className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5" style={{ color: "#ffd700" }} />
              <div className="text-left">
                <span className="text-white font-medium">High Score</span>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Current: {highScore}</p>
              </div>
            </div>
            <button onClick={resetHighScore}
              className="px-3 py-1.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
              style={{ background: "rgba(255,107,107,0.2)", color: "#ff6b6b" }}>
              Reset
            </button>
          </div>
        </div>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Created by Kazibwe Isaac in Uganda<br />
          techwithisaacuk2026@gmail.com
        </p>
      </div>
    </Wrapper>
  );
};

export default Game;
