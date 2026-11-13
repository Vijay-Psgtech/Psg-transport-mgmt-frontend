import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Icon from './dashboard/Icon';
import { getErrorMessage } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function AdvanceNotification() {
  const { user } = useAuth();
  const previousStatus = useRef(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== ROLES.DRIVER) return undefined;
    let active = true;

    const checkForApprovals = async () => {
      try {
        const { data } = await api.get('/trip-advances', { params: { limit: 100 } });
        if (!active) return;
        const statuses = new Map(data.data.map((item) => [item._id, item.status]));
        if (previousStatus.current) {
          const newlyApproved = data.data.find((item) =>
            item.status === 'approved' && previousStatus.current.get(item._id) === 'pending'
          );
          if (newlyApproved) setNotification(newlyApproved);
        }
        previousStatus.current = statuses;
        setError('');
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      }
    };

    checkForApprovals();
    const timer = window.setInterval(checkForApprovals, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user?.role]);

  if (error) {
    return <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Could not check for advance notifications: {error}</p>;
  }
  if (!notification) return null;

  return (
    <aside role="status" aria-live="polite" className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <p className="text-sm text-emerald-950">
          Your trip advance for <strong>{notification.destination}</strong> was approved. Receipt {notification.receiptNo} is ready.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-8 sm:pl-0">
        <Link to="/trip-advances" className="text-sm font-bold text-emerald-900 underline underline-offset-2">View receipt</Link>
        <button type="button" onClick={() => setNotification(null)} aria-label="Dismiss advance notification" className="rounded-md p-1 text-emerald-900 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
