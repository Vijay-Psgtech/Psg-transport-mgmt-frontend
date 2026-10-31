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
    <div className="min-w-0">
      <div className="space-y-3 p-3 sm:hidden">
        {vehicles.map((v) => {
          const status = STATUS_BADGE[v.status] || STATUS_BADGE.inactive;
          const docs = DOC_BADGE[worstDocStatus(v.documents)];
          return (
            <article key={v._id} className="min-w-0 rounded-lg border border-line p-3">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{v.regNo}</h3>
                  <p className="text-xs text-slate-500">{labelOf(VEHICLE_TYPES, v.vehicleType)}</p>
                  <p className="mt-1 break-words text-sm">{v.make} {v.model}</p>
                  {v.manufactureYear && <p className="text-xs text-slate-500">{v.manufactureYear}</p>}
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Seats / fuel</dt>
                  <dd>{v.seatingCapacity} · {labelOf(FUEL_TYPES, v.fuelType)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Driver</dt>
                  <dd className="break-words">{v.assignedDriver?.name || <span className="text-slate-400">Unassigned</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">FASTag</dt>
                  <dd className="break-words">
                    {v.fastagAvailable ? `${v.fastagStatus || 'Available'}${v.fastagIssuingBank ? ` · ${v.fastagIssuingBank}` : ''}` : <span className="text-slate-400">No</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Documents</dt>
                  <dd><Badge tone={docs.tone}>{docs.label}</Badge></dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap justify-end gap-x-3 border-t border-line pt-2">
                <button onClick={() => onEdit(v)} className="rounded px-2 py-1 text-sm font-medium underline underline-offset-4 hover:text-signal-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-signal">
                  Edit
                </button>
                {canDelete && (
                  <button onClick={() => onDelete(v)} className="rounded px-2 py-1 text-sm font-medium text-red-700 underline underline-offset-4 hover:text-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                    Delete
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-slate-600">
            <tr>
              {['Registration', 'Make and model', 'Seats', 'Fuel', 'Driver', 'FASTag', 'Documents', 'Status', ''].map((h) => (
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
                  <td className="px-4 py-3">
                    {v.fastagAvailable
                      ? <><p>{v.fastagStatus}</p><p className="text-xs text-slate-500">{v.fastagIssuingBank} · {v.fastagId}</p></>
                      : <span className="text-slate-400">No</span>}
                  </td>
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
    </div>
  );
}
