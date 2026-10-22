import Badge from './Badge';
import { VEHICLE_TYPES, FUEL_TYPES, labelOf } from '../utils/constants';
import { worstDocStatus } from '../utils/helpers';

const STATUS_BADGE = {
  active: { tone: 'green', label: 'Active' },
  maintenance: { tone: 'amber', label: 'In maintenance' },
  inactive: { tone: 'slate', label: 'Inactive' },
};
const DOC_BADGE = {
  expired: { tone: 'red', label: 'Expired' },
  expiring: { tone: 'amber', label: 'Due soon' },
  valid: { tone: 'green', label: 'Valid' },
  none: { tone: 'slate', label: 'None added' },
};

export default function VehicleTable({ vehicles, canDelete, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas text-slate-600">
          <tr>
            {['Registration', 'Make and model', 'Seats', 'Fuel', 'Driver', 'Documents', 'Status', ''].map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{h || <span className="sr-only">Actions</span>}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {vehicles.map((v) => {
            const status = STATUS_BADGE[v.status] || STATUS_BADGE.inactive;
            const docs = DOC_BADGE[worstDocStatus(v.documents)];
            return (
              <tr key={v._id} className="hover:bg-canvas/60">
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-semibold">{v.regNo}</p>
                  <p className="text-xs text-slate-500">{labelOf(VEHICLE_TYPES, v.vehicleType)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{v.make} {v.model}</p>
                  {v.manufactureYear && <p className="text-xs text-slate-500">{v.manufactureYear}</p>}
                </td>
                <td className="px-4 py-3">{v.seatingCapacity}</td>
                <td className="px-4 py-3">{labelOf(FUEL_TYPES, v.fuelType)}</td>
                <td className="px-4 py-3">{v.assignedDriver?.name || <span className="text-slate-400">Unassigned</span>}</td>
                <td className="px-4 py-3"><Badge tone={docs.tone}>{docs.label}</Badge></td>
                <td className="px-4 py-3"><Badge tone={status.tone}>{status.label}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => onEdit(v)} className="rounded px-2 py-1 font-medium underline underline-offset-4 hover:text-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
                    Edit
                  </button>
                  {canDelete && (
                    <button onClick={() => onDelete(v)} className="ml-1 rounded px-2 py-1 font-medium text-red-700 underline underline-offset-4 hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
