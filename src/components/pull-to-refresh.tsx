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

/** Walk up the DOM finding the closest ancestor that actually scrolls vertically. */
function findScrollParent(el: Element | null): HTMLElement | null {
  let cur: Element | null = el;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const node = cur as HTMLElement;
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 1;
    if (canScroll) return node;
    cur = cur.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
}

/**
 * Native-feeling pull-to-refresh for mobile (iOS / Android PWA).
 *
 * Correctness rules:
 *  - On touchstart, we find the closest scrolling ancestor and require
 *    its scrollTop === 0 to even consider taking over the gesture.
 *  - We commit to "pull" only if the FIRST move is downward AND the
 *    ancestor is still at the top.
 *  - If the user is anywhere mid-scroll, we stay completely passive
 *    (won't preventDefault, won't move the indicator).
 *  - Threshold-based release fires onRefresh; otherwise spring back.
 */
export function PullToRefresh({
  onRefresh,
  threshold = 72,
  maxPull = 120,
  children,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const startY = useRef<number | null>(null);
  const lockedAsPull = useRef(false);
  // We freeze "we started at the top" once at touchstart — defends against
  // edge cases where scrollTop changes mid-gesture from inertia.
  const startedAtTop = useRef(false);
  const [pullDelta, setPullDelta] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: RTouchEvent) => {
    if (e.touches.length !== 1 || refreshing) return;
    const sp = findScrollParent(containerRef.current);
    scrollParentRef.current = sp;
    startedAtTop.current = !!sp && sp.scrollTop <= 0;
    if (!startedAtTop.current) return;
    startY.current = e.touches[0]!.clientY;
    lockedAsPull.current = false;
  };

  const onTouchMove = (e: RTouchEvent) => {
    if (
      startY.current === null ||
      refreshing ||
      !startedAtTop.current
    )
      return;

    // If the user has scrolled DOWN inside the parent (scrollTop became >0)
    // since touchstart, abort: this is a normal scroll.
    const sp = scrollParentRef.current;
    if (sp && sp.scrollTop > 0) {
      setPullDelta(0);
      lockedAsPull.current = false;
      return;
    }

    const dy = e.touches[0]!.clientY - startY.current;
    if (dy <= 0) {
      // Finger going up — let the page scroll normally
      setPullDelta(0);
      lockedAsPull.current = false;
      return;
    }
    // Commit only when finger crosses 8px DOWN while parent is at top
    if (dy > 8) lockedAsPull.current = true;
    if (!lockedAsPull.current) return;

    // Resistance curve
    const eased = dy < maxPull ? dy : maxPull + (dy - maxPull) * 0.3;
    setPullDelta(eased);
    if (e.cancelable) e.preventDefault();
  };

  const onTouchEnd = async () => {
    if (startY.current === null) {
      setPullDelta(0);
      return;
    }
    const dy = pullDelta;
    startY.current = null;
    const wasLocked = lockedAsPull.current;
    lockedAsPull.current = false;
    startedAtTop.current = false;
    if (refreshing) return;
    if (wasLocked && dy >= threshold) {
      setRefreshing(true);
      setPullDelta(56);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDelta(0);
      }
    } else {
      setPullDelta(0);
    }
  };

  // Desktop guard
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
