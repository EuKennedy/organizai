import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as RTouchEvent,
} from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  /** Async refresh callback. Receives no args. */
  onRefresh: () => Promise<void>;
  /** Distance (px) the user must drag before refresh fires. Default 72. */
  threshold?: number;
  /** Max distance the indicator visually moves. Default 120. */
  maxPull?: number;
  /** Wraps any node — usually a page or list. */
  children: ReactNode;
}

/**
 * Native-feeling pull-to-refresh for mobile (iOS / Android PWA).
 *
 * Logic:
 *  - Only activates when the scroll container is at the very top (scrollY = 0)
 *  - Tracks finger Y delta on touchmove
 *  - Releasing past `threshold` triggers `onRefresh`
 *  - Indicator (refresh icon) sits behind the content and reveals as user pulls
 *
 * Doesn't interfere with vertical scroll past the top — once finger passes
 * touchstart Y by 8px and we're at scrollY=0, we own the gesture.
 */
export function PullToRefresh({
  onRefresh,
  threshold = 72,
  maxPull = 120,
  children,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const lockedAsPull = useRef(false);
  const [pullDelta, setPullDelta] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: RTouchEvent) => {
    // Only consider single-finger gestures
    if (e.touches.length !== 1) return;
    // Find scroll parent — fallback to window
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 4) return; // not at top, normal scroll
    startY.current = e.touches[0]!.clientY;
    lockedAsPull.current = false;
  };

  const onTouchMove = (e: RTouchEvent) => {
    if (startY.current === null || refreshing) return;
    const dy = e.touches[0]!.clientY - startY.current;
    if (dy <= 0) {
      // Reset if user swipes up — release the gesture
      setPullDelta(0);
      return;
    }
    // We commit to pull-to-refresh once they cross 8px
    if (dy > 8) lockedAsPull.current = true;
    if (!lockedAsPull.current) return;
    // Resistance curve — slows the pull as they go further
    const eased = dy < maxPull ? dy : maxPull + (dy - maxPull) * 0.3;
    setPullDelta(eased);
    // Prevent native overscroll bounce on iOS while pulling
    if (e.cancelable) e.preventDefault();
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    const dy = pullDelta;
    startY.current = null;
    lockedAsPull.current = false;
    if (refreshing) return;
    if (dy >= threshold) {
      setRefreshing(true);
      setPullDelta(56); // Snap to a stable refresh state
      try {
        await onRefresh();
      } finally {
        // Settle back
        setRefreshing(false);
        setPullDelta(0);
      }
    } else {
      setPullDelta(0);
    }
  };

  // Desktop guard — disable entirely on mouse-driven scroll
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window);
  }, []);

  if (!isTouchDevice) {
    return <>{children}</>;
  }

  const indicatorOpacity = Math.min(pullDelta / threshold, 1);
  const indicatorRotate = Math.min((pullDelta / threshold) * 180, 180);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="relative"
    >
      {/* Indicator — fixed position so it overlays content */}
      <motion.div
        animate={{
          y: pullDelta - 32,
          opacity: indicatorOpacity,
        }}
        transition={
          refreshing
            ? { duration: 0.2 }
            : pullDelta === 0
            ? { type: "spring", damping: 22, stiffness: 320 }
            : { duration: 0 }
        }
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center"
        style={{ top: "calc(3rem + env(safe-area-inset-top))" }}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-card/95 shadow-lg shadow-black/20 ring-1 ring-border backdrop-blur-md"
          )}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 text-primary",
              refreshing && "animate-spin"
            )}
            strokeWidth={2.5}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${indicatorRotate}deg)`,
              transition: refreshing ? undefined : "transform 0.05s linear",
            }}
          />
        </div>
      </motion.div>

      {/* Content shifts down as user pulls (subtle) */}
      <motion.div
        animate={{ y: pullDelta * 0.5 }}
        transition={
          refreshing
            ? { duration: 0.2 }
            : pullDelta === 0
            ? { type: "spring", damping: 22, stiffness: 320 }
            : { duration: 0 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
