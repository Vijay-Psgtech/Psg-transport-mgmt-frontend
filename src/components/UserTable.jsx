import Badge from './Badge';
import { ROLE_LABELS, LICENSE_CLASSES, VEHICLE_TYPES, labelOf } from '../utils/constants';
import { docStatus, formatDate, formatDateTime } from '../utils/helpers';

const btn = 'rounded px-2 py-1 font-medium underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal';

function Licence({ profile }) {
  if (!profile?.licenseNumber) return <span className="text-slate-400">Not recorded</span>;
  const status = docStatus(profile.licenseExpiry);
  return (
    <div>
      <p className="font-medium">{profile.licenseNumber} <span className="font-normal text-slate-500">{profile.licenseClass && `· ${profile.licenseClass}`}</span></p>
      <p className="text-xs text-slate-500">
        {status === 'expired' && <Badge tone="red">Expired {formatDate(profile.licenseExpiry)}</Badge>}
        {status === 'expiring' && <Badge tone="amber">Due {formatDate(profile.licenseExpiry)}</Badge>}
        {status === 'valid' && <>Valid until {formatDate(profile.licenseExpiry)}</>}
      </p>
    </div>
  );
}

// variant "drivers": licence and vehicle columns. variant "users": role and last sign-in columns.
export default function UserTable({ users, variant, currentUserId, isAdmin, onEdit, onReset, onToggle, onDelete }) {
  const drivers = variant === 'drivers';
  const headers = drivers
    ? ['Name', 'Contact', 'Licence', 'Vehicle', 'Status', '']
    : ['Name', 'Role', 'Contact', 'ID', 'Last sign in', 'Status', ''];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas text-slate-600">
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{h || <span className="sr-only">Actions</span>}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((u) => {
            const self = u._id === currentUserId;
            return (
              <tr key={u._id} className={u.isActive ? 'hover:bg-canvas/60' : 'bg-canvas/50 text-slate-500'}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{u.name}{self && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p>
                  {drivers && u.driverProfile?.bloodGroup && <p className="text-xs text-slate-500">Blood group {u.driverProfile.bloodGroup}</p>}
                  {!drivers && <p className="text-xs text-slate-500">{u.email || 'No email'}</p>}
                </td>

                {!drivers && <td className="whitespace-nowrap px-4 py-3">{ROLE_LABELS[u.role]}</td>}

                <td className="px-4 py-3">
                  {drivers && u.email && <p>{u.email}</p>}
                  <p className={drivers ? 'text-xs text-slate-500' : ''}>{u.phone || (drivers ? 'No phone' : '-')}</p>
                </td>

                {drivers ? (
                  <>
                    <td className="px-4 py-3"><Licence profile={u.driverProfile} /></td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {u.assignedVehicle
                        ? <>{u.assignedVehicle.regNo} <span className="text-xs text-slate-500">{labelOf(VEHICLE_TYPES, u.assignedVehicle.vehicleType)}</span></>
                        : <span className="text-slate-400">Unassigned</span>}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">{u.idNumber || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDateTime(u.lastLoginAt)}</td>
                  </>
                )}

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={u.isActive ? 'green' : 'slate'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    {u.mustChangePassword && <Badge tone="amber">Temporary password</Badge>}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button onClick={() => onEdit(u)} className={btn}>Edit</button>
                  <button onClick={() => onReset(u)} className={`${btn} ml-1`}>Reset password</button>
                  {!self && (
                    <button onClick={() => onToggle(u)} className={`${btn} ml-1 ${u.isActive ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  {isAdmin && !self && (
                    <button onClick={() => onDelete(u)} className={`${btn} ml-1 text-red-700`}>Delete</button>
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
