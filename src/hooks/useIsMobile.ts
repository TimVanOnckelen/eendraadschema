import { useEffect, useState } from 'react';

/** Breakpoint below which the UI switches to its single-column mobile layout. */
export const MOBILE_BREAKPOINT = 768;

const query = `(max-width: ${MOBILE_BREAKPOINT}px)`;

const matches = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches
    : false;

/** Returns true while the viewport is narrower than the mobile breakpoint. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(matches);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
