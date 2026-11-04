import Badge from './Badge';
import { ROLE_LABELS } from '../utils/constants';
import { docStatus, formatDate, formatDateTime } from '../utils/helpers';

const btn = 'rounded px-2 py-1 font-medium underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal';

function UserActions({ user, self, isAdmin, onEdit, onReset, onToggle, onDelete, mobile = false }) {
  const actionClass = mobile ? `${btn} text-sm` : btn;
  return (
    <>
      <button onClick={() => onEdit(user)} className={actionClass}>Edit</button>
      <button onClick={() => onReset(user)} className={`${actionClass} ${mobile ? '' : 'ml-1'}`}>Reset password</button>
      {!self && (
        <button
          onClick={() => onToggle(user)}
          className={`${actionClass} ${mobile ? '' : 'ml-1'} ${user.isActive ? 'text-amber-800' : 'text-emerald-800'}`}
        >
          {user.isActive ? 'Deactivate' : 'Activate'}
        </button>
      )}
      {isAdmin && !self && (
        <button onClick={() => onDelete(user)} className={`${actionClass} ${mobile ? '' : 'ml-1'} text-red-700`}>Delete</button>
      )}
    </>
  );
}

function UserCard({ user, drivers, currentUserId, isAdmin, onEdit, onReset, onToggle, onDelete }) {
  const self = user._id === currentUserId;
  return (
    <article className={`min-w-0 rounded-lg border border-line p-3 ${user.isActive ? '' : 'bg-canvas/50 text-slate-500'}`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-semibold">
            {user.name}{self && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}
          </h3>
          {drivers && user.driverProfile?.bloodGroup && (
            <p className="text-xs text-slate-500">Blood group {user.driverProfile.bloodGroup}</p>
          )}
          {!drivers && <p className="break-all text-xs text-slate-500">{user.email || 'No email'}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Badge tone={user.isActive ? 'green' : 'slate'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
          {user.mustChangePassword && <Badge tone="amber">Temporary password</Badge>}
        </div>
      </div>

      <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
        {!drivers && (
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">Role</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
          </div>
        )}
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">Contact</dt>
          {drivers && user.email && <dd className="break-all">{user.email}</dd>}
          <dd className={drivers ? 'break-words text-xs text-slate-500' : 'break-words'}>
            {user.phone || (drivers ? 'No phone' : '-')}
          </dd>
        </div>
        {drivers ? (
          <>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Licence</dt>
              <dd className="break-words"><Licence profile={user.driverProfile} /></dd>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">ID</dt>
              <dd className="break-words">{user.idNumber || '-'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">Last sign in</dt>
              <dd className="break-words text-xs">{formatDateTime(user.lastLoginAt)}</dd>
            </div>
          </>
        )}
      </dl>

      <div className="mt-3 flex flex-wrap justify-end gap-x-2 gap-y-1 border-t border-line pt-2">
        <UserActions
          user={user}
          self={self}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onReset={onReset}
          onToggle={onToggle}
          onDelete={onDelete}
          mobile
        />
      </div>
    </article>
  );
}

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
    ? ['Name', 'Contact', 'Licence', 'Status', '']
    : ['Name', 'Role', 'Contact', 'ID', 'Last sign in', 'Status', ''];

  return (
    <div className="min-w-0">
      <div className="space-y-3 p-3 sm:hidden">
        {users.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            drivers={drivers}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onReset={onReset}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
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
                    <UserActions user={u} self={self} isAdmin={isAdmin} onEdit={onEdit} onReset={onReset} onToggle={onToggle} onDelete={onDelete} />
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
