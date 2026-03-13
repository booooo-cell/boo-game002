import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Star, Gift, ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Cake } from 'lucide-react';

// --- Constants ---
const TILE_SIZE = 32;
const GRAVITY = 0.45;
const JUMP_FORCE = -9.5;
const MOVE_SPEED = 3.5;

// --- Level Definition ---
const LEVEL = {
  width: 800,
  height: 600,
  tiles: [
    // Ground
    ...Array(25).fill(0).map((_, i) => ({ x: i * TILE_SIZE, y: 18 * TILE_SIZE, type: 1 })),
    // Platforms
    { x: 4 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 5 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 6 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    
    { x: 10 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 11 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 12 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },

    { x: 16 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 17 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },
    { x: 18 * TILE_SIZE, y: 14 * TILE_SIZE, type: 1 },

    { x: 13 * TILE_SIZE, y: 11 * TILE_SIZE, type: 1 },
    { x: 14 * TILE_SIZE, y: 11 * TILE_SIZE, type: 1 },
    { x: 15 * TILE_SIZE, y: 11 * TILE_SIZE, type: 1 },

    { x: 7 * TILE_SIZE, y: 9 * TILE_SIZE, type: 1 },
    { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, type: 1 },
    { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, type: 1 },

    // Spikes (Cute thorns)
    { x: 8 * TILE_SIZE, y: 17.5 * TILE_SIZE, type: 2 },
    { x: 9 * TILE_SIZE, y: 17.5 * TILE_SIZE, type: 2 },
    { x: 14 * TILE_SIZE, y: 17.5 * TILE_SIZE, type: 2 },

    // Strawberries (Collectibles)
    { x: 5 * TILE_SIZE, y: 13 * TILE_SIZE, type: 3 },
    { x: 11 * TILE_SIZE, y: 13 * TILE_SIZE, type: 3 },
    { x: 17 * TILE_SIZE, y: 13 * TILE_SIZE, type: 3 },
    { x: 14 * TILE_SIZE, y: 10 * TILE_SIZE, type: 3 },
    { x: 8 * TILE_SIZE, y: 8 * TILE_SIZE, type: 3 },

    // Birthday Gift Box (Finish)
    { x: 22 * TILE_SIZE, y: 16 * TILE_SIZE, type: 4 },
  ]
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [collectedItems, setCollectedItems] = useState(0);
  const totalItems = LEVEL.tiles.filter(t => t.type === 3).length;

  const playerRef = useRef({
    x: 50,
    y: 500,
    vx: 0,
    vy: 0,
    width: 28,
    height: 32,
    onGround: false,
    facing: 1,
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [touchControls, setTouchControls] = useState({ left: false, right: false, up: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (gameState === 'start' && e.code === 'Space') startGame();
      if ((gameState === 'won' || gameState === 'lost') && e.code === 'KeyR') resetGame();
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setCollectedItems(0);
    playerRef.current = {
      x: 50,
      y: 500,
      vx: 0,
      vy: 0,
      width: 28,
      height: 32,
      onGround: false,
      facing: 1,
    };
    LEVEL.tiles.forEach(t => { if (t.type === 3) (t as any).collected = false; });
  };

  const resetGame = () => startGame();

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      const p = playerRef.current;

      const left = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] || touchControls.left;
      const right = keysRef.current['ArrowRight'] || keysRef.current['KeyD'] || touchControls.right;
      const up = keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space'] || touchControls.up;

      if (left) {
        p.vx = -MOVE_SPEED;
        p.facing = -1;
      } else if (right) {
        p.vx = MOVE_SPEED;
        p.facing = 1;
      } else {
        p.vx *= 0.8;
      }

      if (up && p.onGround) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
      }

      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      p.onGround = false;
      LEVEL.tiles.forEach(tile => {
        if (tile.type === 1) {
          if (p.x < tile.x + TILE_SIZE && p.x + p.width > tile.x && p.y < tile.y + TILE_SIZE && p.y + p.height > tile.y) {
            const overlapX = Math.min(p.x + p.width - tile.x, tile.x + TILE_SIZE - p.x);
            const overlapY = Math.min(p.y + p.height - tile.y, tile.y + TILE_SIZE - p.y);
            if (overlapX > overlapY) {
              if (p.vy > 0) { p.y = tile.y - p.height; p.vy = 0; p.onGround = true; }
              else { p.y = tile.y + TILE_SIZE; p.vy = 0; }
            } else {
              if (p.vx > 0) p.x = tile.x - p.width;
              else p.x = tile.x + TILE_SIZE;
            }
          }
        } else if (tile.type === 2) {
          if (p.x < tile.x + TILE_SIZE && p.x + p.width > tile.x && p.y < tile.y + TILE_SIZE && p.y + p.height > tile.y) {
            setGameState('lost');
          }
        } else if (tile.type === 3 && !(tile as any).collected) {
          if (p.x < tile.x + TILE_SIZE && p.x + p.width > tile.x && p.y < tile.y + TILE_SIZE && p.y + p.height > tile.y) {
            (tile as any).collected = true;
            setCollectedItems(prev => prev + 1);
          }
        } else if (tile.type === 4) {
          if (p.x < tile.x + TILE_SIZE && p.x + p.width > tile.x && p.y < tile.y + TILE_SIZE && p.y + p.height > tile.y) {
             setCollectedItems(current => {
                if (current === totalItems) setGameState('won');
                return current;
             });
          }
        }
      });

      if (p.x < 0) p.x = 0;
      if (p.x + p.width > LEVEL.width) p.x = LEVEL.width - p.width;
      if (p.y > LEVEL.height) setGameState('lost');
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background - Pink Sky
      ctx.fillStyle = '#fff0f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clouds/Hearts in background
      ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
      for(let i=0; i<15; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Level
      LEVEL.tiles.forEach(tile => {
        if (tile.type === 1) {
          ctx.fillStyle = '#ffb6c1'; // Pink Ground
          ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#ff69b4'; // Darker Pink top
          ctx.fillRect(tile.x, tile.y, TILE_SIZE, 4);
        } else if (tile.type === 2) {
          ctx.fillStyle = '#db7093'; // Thorns
          ctx.beginPath();
          ctx.moveTo(tile.x, tile.y + TILE_SIZE);
          ctx.lineTo(tile.x + TILE_SIZE / 2, tile.y + 10);
          ctx.lineTo(tile.x + TILE_SIZE, tile.y + TILE_SIZE);
          ctx.fill();
        } else if (tile.type === 3 && !(tile as any).collected) {
          // Strawberry
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(tile.x + 16, tile.y + 20, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#00ff00'; // Leaf
          ctx.fillRect(tile.x + 14, tile.y + 10, 4, 4);
        } else if (tile.type === 4) {
          // Birthday Gift
          ctx.fillStyle = '#ff69b4';
          ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#ffffff'; // Ribbon
          ctx.fillRect(tile.x + 14, tile.y, 4, TILE_SIZE);
          ctx.fillRect(tile.x, tile.y + 14, TILE_SIZE, 4);
          // Bow
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tile.x + 16, tile.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Player (Hello Kitty Style)
      const p = playerRef.current;
      // Body
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x, p.y + 12, p.width, 20);
      // Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(p.x + p.width/2, p.y + 10, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.beginPath();
      ctx.moveTo(p.x + 2, p.y + 2);
      ctx.lineTo(p.x + 10, p.y + 4);
      ctx.lineTo(p.x + 6, p.y + 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x + p.width - 2, p.y + 2);
      ctx.lineTo(p.x + p.width - 10, p.y + 4);
      ctx.lineTo(p.x + p.width - 6, p.y + 10);
      ctx.fill();
      // Bow
      ctx.fillStyle = '#ff1493';
      ctx.beginPath();
      ctx.arc(p.x + p.width - 6, p.y + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x + p.width/2 + (p.facing * 4), p.y + 8, 2, 3);
      ctx.fillRect(p.x + p.width/2 + (p.facing * 10), p.y + 8, 2, 3);
      // Nose
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(p.x + p.width/2 + (p.facing * 7), p.y + 12, 3, 2);

      // HUD
      ctx.font = '10px "Press Start 2P"';
      ctx.fillStyle = '#ff69b4';
      ctx.fillText(`STRAWBERRIES: ${collectedItems}/${totalItems}`, 20, 40);
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, collectedItems, totalItems, touchControls]);

  const handleTouchStart = (dir: 'left' | 'right' | 'up') => setTouchControls(prev => ({ ...prev, [dir]: true }));
  const handleTouchEnd = (dir: 'left' | 'right' | 'up') => setTouchControls(prev => ({ ...prev, [dir]: false }));

  return (
    <div className="min-h-screen bg-[#fff0f5] flex flex-col items-center justify-center p-2 font-pixel select-none">
      <div className="relative pixel-border-pink bg-white overflow-hidden max-w-full" style={{ width: LEVEL.width, height: LEVEL.height, aspectRatio: '4/3' }}>
        <canvas
          ref={canvasRef}
          width={LEVEL.width}
          height={LEVEL.height}
          className="w-full h-full object-contain"
        />

        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pink-100/90 flex flex-col items-center justify-center text-pink-500 text-center p-4 z-40"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-6"
              >
                <Heart className="w-16 h-16 fill-current" />
              </motion.div>
              <h1 className="text-xl md:text-2xl mb-6 font-cute text-pink-600">丽媛的凯蒂猫生日大冒险</h1>
              <div className="flex gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full mb-1" />
                  <span className="text-[8px]">收集草莓</span>
                </div>
                <div className="flex flex-col items-center">
                  <Gift className="w-10 h-10 text-pink-500 mb-1" />
                  <span className="text-[8px]">寻找礼物</span>
                </div>
              </div>
              <button onClick={startGame} className="cute-button mb-4">开始游戏</button>
              <p className="text-[8px] opacity-60">
                操作: 屏幕按钮 或 键盘方向键
              </p>
            </motion.div>
          )}

          {gameState === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-pink-50 flex flex-col items-center justify-center text-pink-600 text-center p-4 z-50"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * LEVEL.width }}
                    animate={{ y: LEVEL.height + 20, rotate: 360 }}
                    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    className="absolute"
                  >
                    {i % 2 === 0 ? <Heart className="w-4 h-4 fill-pink-300" /> : <Star className="w-4 h-4 fill-yellow-300" />}
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="relative z-10 px-4">
                <Cake className="w-20 h-20 text-pink-500 mx-auto mb-6 animate-bounce" />
                <h2 className="text-2xl md:text-3xl mb-6 font-cute">周丽媛生日快乐ヾ(≧▽≦*)o</h2>
                <p className="text-sm md:text-lg mb-8 leading-loose font-cute">
                  愿你的每一天都像草莓一样甜美！🍓✨
                </p>
                <button onClick={resetGame} className="cute-button flex items-center gap-2 mx-auto">
                  <RefreshCw className="w-5 h-5" /> 再玩一次
                </button>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-pink-200/60 flex flex-col items-center justify-center text-pink-700 text-center p-4 z-40"
            >
              <h2 className="text-xl mb-6 font-cute">哎呀，不小心摔倒了</h2>
              <button onClick={resetGame} className="cute-button flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> 重新开始
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Controls */}
      {gameState === 'playing' && (
        <div className="mt-6 flex justify-between w-full max-w-[450px] px-6">
          <div className="flex gap-6">
            <button 
              className="mobile-btn"
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              onMouseLeave={() => handleTouchEnd('left')}
            >
              <ArrowLeft className="w-10 h-10" />
            </button>
            <button 
              className="mobile-btn"
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              onMouseLeave={() => handleTouchEnd('right')}
            >
              <ArrowRight className="w-10 h-10" />
            </button>
          </div>
          <button 
            className="mobile-btn"
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
            onMouseDown={() => handleTouchStart('up')}
            onMouseUp={() => handleTouchEnd('up')}
            onMouseLeave={() => handleTouchEnd('up')}
          >
            <ArrowUp className="w-10 h-10" />
          </button>
        </div>
      )}

      <div className="mt-6 text-pink-300 text-[8px] md:text-[10px] hidden md:block">
        [↑/W/Space] 跳跃 | [←/A][→/D] 移动 | [R] 重置
      </div>
    </div>
  );
}
