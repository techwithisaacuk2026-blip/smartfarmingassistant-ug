import { useRef, useCallback, useEffect, useState } from "react";

const CANVAS_W = 400;
const CANVAS_H = 600;
const BALL_R = 18;
const GRAVITY = 0.55;
const JUMP_VEL = -11;
const PLATFORM_W = 70;
const PLATFORM_H = 14;
const PLATFORM_SPEED_BASE = 3;
const PLATFORM_GAP_MIN = 100;
const PLATFORM_GAP_MAX = 180;

interface Platform {
  x: number;
  y: number;
  w: number;
  scored: boolean;
}

export function useGameEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onScore: () => void,
  onGameOver: () => void,
  onLand: () => void,
) {
  const ballRef = useRef({ x: 80, y: CANVAS_H / 2, vy: 0 });
  const platformsRef = useRef<Platform[]>([]);
  const frameRef = useRef(0);
  const speedRef = useRef(PLATFORM_SPEED_BASE);
  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  const initGame = useCallback(() => {
    const ball = ballRef.current;
    ball.x = 80;
    ball.y = CANVAS_H / 2;
    ball.vy = 0;
    speedRef.current = PLATFORM_SPEED_BASE;
    frameRef.current = 0;

    // Create initial platforms
    const plats: Platform[] = [];
    // Starting platform under ball
    plats.push({ x: 50, y: CANVAS_H / 2 + BALL_R + 2, w: PLATFORM_W + 30, scored: true });
    let lastX = 50;
    for (let i = 1; i < 6; i++) {
      const gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      const x = lastX + gap;
      const y = CANVAS_H / 2 + (Math.random() - 0.5) * 200;
      plats.push({ x, y: Math.max(100, Math.min(CANVAS_H - 60, y)), w: PLATFORM_W, scored: false });
      lastX = x;
    }
    platformsRef.current = plats;
  }, []);

  const jump = useCallback(() => {
    if (!runningRef.current) return;
    ballRef.current.vy = JUMP_VEL;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const ball = ballRef.current;
    const plats = platformsRef.current;

    // BG gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#1a1a2e");
    grad.addColorStop(1, "#16213e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137 + frameRef.current * 0.2) % CANVAS_W);
      const sy = (i * 97) % CANVAS_H;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Platforms
    plats.forEach((p) => {
      ctx.fillStyle = "#00d2ff";
      ctx.shadowColor = "#00d2ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, PLATFORM_H, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Ball
    ctx.fillStyle = "#ff6b6b";
    ctx.shadowColor = "#ff6b6b";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(ball.x - 5, ball.y - 5, 6, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ball = ballRef.current;
    const plats = platformsRef.current;

    frameRef.current++;

    // Increase speed over time
    if (frameRef.current % 300 === 0) {
      speedRef.current = Math.min(speedRef.current + 0.3, 8);
    }

    // Physics
    ball.vy += GRAVITY;
    ball.y += ball.vy;

    // Move platforms left
    plats.forEach((p) => {
      p.x -= speedRef.current;
    });

    // Remove off-screen platforms and add new ones
    while (plats.length > 0 && plats[0].x + plats[0].w < -10) {
      plats.shift();
    }
    const last = plats[plats.length - 1];
    if (last && last.x < CANVAS_W) {
      const gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
      const newY = CANVAS_H / 2 + (Math.random() - 0.5) * 250;
      plats.push({
        x: last.x + gap,
        y: Math.max(80, Math.min(CANVAS_H - 60, newY)),
        w: PLATFORM_W + (Math.random() > 0.7 ? 30 : 0),
        scored: false,
      });
    }

    // Collision detection
    let onPlatform = false;
    for (const p of plats) {
      if (
        ball.vy >= 0 &&
        ball.x + BALL_R > p.x &&
        ball.x - BALL_R < p.x + p.w &&
        ball.y + BALL_R >= p.y &&
        ball.y + BALL_R <= p.y + PLATFORM_H + ball.vy + 2
      ) {
        ball.y = p.y - BALL_R;
        ball.vy = 0;
        onPlatform = true;
        if (!p.scored) {
          p.scored = true;
          onScore();
          onLand();
        }
        break;
      }
    }

    // Game over conditions
    if (ball.y - BALL_R > CANVAS_H || ball.y + BALL_R < 0) {
      runningRef.current = false;
      setIsRunning(false);
      onGameOver();
      return;
    }

    draw(ctx);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [canvasRef, draw, onScore, onGameOver, onLand]);

  const start = useCallback(() => {
    initGame();
    runningRef.current = true;
    setIsRunning(true);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [initGame, gameLoop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop, jump, isRunning, CANVAS_W, CANVAS_H };
}
