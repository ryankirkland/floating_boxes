import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './App.css';

const BOX_COUNT = 7;
const BOX_SIZES = [110, 70, 95, 130, 60, 85, 120];
const MIN_SPEED = 60; // pixels per second
const MAX_SPEED = 160;

const getRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
const randomDirection = () => (Math.random() > 0.5 ? 1 : -1);

const getInitialBounds = () => {
  if (typeof window === 'undefined') {
    return { width: 800, height: 600 };
  }
  return { width: window.innerWidth, height: window.innerHeight * 0.8 };
};

const createBox = (id, bounds) => {
  const size = BOX_SIZES[id % BOX_SIZES.length];
  const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
  return {
    id,
    size,
    color: getRandomColor(),
    x: Math.random() * Math.max(bounds.width - size, 0),
    y: Math.random() * Math.max(bounds.height - size, 0),
    dx: speed * randomDirection(),
    dy: speed * randomDirection(),
  };
};

const createInitialBoxes = (bounds) => {
  return Array.from({ length: BOX_COUNT }, (_, index) => createBox(index, bounds));
};

function App() {
  const playgroundRef = useRef(null);
  const animationRef = useRef(0);
  const lastTickRef = useRef(0);
  const boundsRef = useRef(getInitialBounds());

  const [boxes, setBoxes] = useState(() => createInitialBoxes(boundsRef.current));

  const refreshBounds = useCallback(() => {
    const container = playgroundRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    boundsRef.current = { width: rect.width, height: rect.height };
  }, []);

  useLayoutEffect(() => {
    refreshBounds();
    setBoxes((prev) => {
      const { width, height } = boundsRef.current;
      return prev.map((box) => {
        const maxX = Math.max(width - box.size, 0);
        const maxY = Math.max(height - box.size, 0);
        return {
          ...box,
          x: Math.min(box.x, maxX),
          y: Math.min(box.y, maxY),
        };
      });
    });
  }, [refreshBounds]);

  useEffect(() => {
    const handleResize = () => {
      refreshBounds();
      setBoxes((prev) => {
        const { width, height } = boundsRef.current;
        return prev.map((box) => {
          const maxX = Math.max(width - box.size, 0);
          const maxY = Math.max(height - box.size, 0);
          return {
            ...box,
            x: Math.min(box.x, maxX),
            y: Math.min(box.y, maxY),
          };
        });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshBounds]);

  useEffect(() => {
    const step = (timestamp) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }
      const delta = Math.min((timestamp - lastTickRef.current) / 1000, 0.05);
      lastTickRef.current = timestamp;
      const { width, height } = boundsRef.current;

      setBoxes((prev) =>
        prev.map((box) => {
          let { x, y, dx, dy, size } = box;
          let nextX = x + dx * delta;
          let nextY = y + dy * delta;

          if (nextX <= 0) {
            nextX = 0;
            dx = Math.abs(dx);
          } else if (nextX + size >= width) {
            nextX = Math.max(width - size, 0);
            dx = -Math.abs(dx);
          }

          if (nextY <= 0) {
            nextY = 0;
            dy = Math.abs(dy);
          } else if (nextY + size >= height) {
            nextY = Math.max(height - size, 0);
            dy = -Math.abs(dy);
          }

          return {
            ...box,
            x: nextX,
            y: nextY,
            dx,
            dy,
          };
        })
      );

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleChangeColor = () => {
    setBoxes((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const index = Math.floor(Math.random() * prev.length);
      return prev.map((box, i) =>
        i === index
          ? {
              ...box,
              color: getRandomColor(),
            }
          : box
      );
    });
  };

  return (
    <div className="app">
      <header className="controls">
        <h1 className="title">Floating Color Boxes</h1>
        <button type="button" className="action" onClick={handleChangeColor}>
          Change Color
        </button>
      </header>
      <div ref={playgroundRef} className="playground">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="floating-box"
            style={{
              width: box.size,
              height: box.size,
              backgroundColor: box.color,
              transform: `translate(${box.x}px, ${box.y}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
