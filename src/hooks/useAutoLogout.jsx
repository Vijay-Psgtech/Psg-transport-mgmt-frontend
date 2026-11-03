import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];

export default function useAutoLogout(timeoutMs = DEFAULT_IDLE_TIMEOUT_MS) {
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let timeoutId;
    let lastActivity = Date.now();

    const scheduleLogout = () => {
      window.clearTimeout(timeoutId);
      const remainingTime = Math.max(timeoutMs - (Date.now() - lastActivity), 0);

      timeoutId = window.setTimeout(() => {
        if (Date.now() - lastActivity >= timeoutMs) {
          logout().catch((error) => {
            console.error('Automatic logout failed:', error);
          });
          return;
        }

        scheduleLogout();
      }, remainingTime);
    };

    const recordActivity = () => {
      lastActivity = Date.now();
      scheduleLogout();
    };

    scheduleLogout();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
    };
  }, [isAuthenticated, logout, timeoutMs]);
}