import { Link } from 'react-router-dom';
import Icon from './dashboard/Icon';

export default function TripSheetHistory({ assignmentId }) {
  return (
    <Link
      to={`/vehicle-assignments/${assignmentId}/trip-sheets`}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-asphalt hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
    >
      <Icon name="route" className="h-4 w-4" />
      View trip sheets
      <span aria-hidden="true">→</span>
    </Link>
  );
}
