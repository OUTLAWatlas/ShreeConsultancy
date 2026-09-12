import { useCallback, useRef, useState } from 'react';

const CLICK_WINDOW_MS = 600;
const REQUIRED_CLICKS = 3;

/**
 * Fires `onTrigger` when the returned handler is called three times in a row
 * within CLICK_WINDOW_MS of each other. Any gap longer than that resets the
 * count back to zero.
 *
 * Usage:
 *   const handleLogoClick = useTripleClickLogo(() => { window.location.href = ADMIN_URL; });
 *   <button onClick={handleLogoClick}>...</button>
 */
export function useTripleClickLogo(onTrigger) {
  const [, forceRender] = useState(0);
  const countRef = useRef(0);
  const lastClickAt = useRef(0);
  const timeoutRef = useRef(null);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const withinWindow = now - lastClickAt.current < CLICK_WINDOW_MS;
    lastClickAt.current = now;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    countRef.current = withinWindow ? countRef.current + 1 : 1;

    if (countRef.current >= REQUIRED_CLICKS) {
      countRef.current = 0;
      onTrigger?.();
      return;
    }

    timeoutRef.current = setTimeout(() => {
      countRef.current = 0;
    }, CLICK_WINDOW_MS);

    forceRender((n) => n + 1);
  }, [onTrigger]);

  return handleClick;
}
