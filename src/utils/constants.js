export const ROLES = {
  ADMIN: 'admin',
  TRANSPORT_OFFICER: 'transport_officer',
  DRIVER: 'driver',
  STAFF: 'staff',
  STUDENT: 'student',
  PARENT: 'parent',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  transport_officer: 'Transport officer',
  driver: 'Driver',
  staff: 'Staff',
  student: 'Student',
  parent: 'Parent',
};

// Roles that can view and maintain the fleet (mirrors the backend FLEET_MANAGERS)
export const MANAGER_ROLES = [ROLES.ADMIN, ROLES.TRANSPORT_OFFICER];

export const VEHICLE_TYPES = [
  { value: 'bus', label: 'Bus' },
  { value: 'minibus', label: 'Mini bus' },
  { value: 'van', label: 'Van' },
  { value: 'car', label: 'Car' },
];

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const VEHICLE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'In maintenance' },
  { value: 'inactive', label: 'Inactive' },
];

export const DOCUMENT_TYPES = [
  { value: 'registration', label: 'Registration certificate (RC)' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'fitness', label: 'Fitness certificate (FC)' },
  { value: 'permit', label: 'Permit' },
  { value: 'puc', label: 'Pollution certificate (PUC)' },
  { value: 'tax', label: 'Road tax' },
];

export const labelOf = (list, value) => list.find((i) => i.value === value)?.label ?? value;

// Same pattern as the backend, applied after stripping spaces and hyphens: TN38AB1234
export const REG_NO_REGEX = /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/;

// ---- Phase 2: users and drivers ----
export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const LICENSE_CLASSES = [
  { value: 'LMV', label: 'Light motor vehicle (LMV)' },
  { value: 'HMV', label: 'Heavy motor vehicle (HMV)' },
  { value: 'HPMV', label: 'Heavy passenger motor vehicle (HPMV)' },
];

export const PHONE_REGEX = /^\+?[\d\s-]{7,15}$/;
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// Compact names for charts and lists where space is tight
export const DOCUMENT_SHORT = { registration: 'RC', insurance: 'Insurance', fitness: 'Fitness', permit: 'Permit', puc: 'PUC', tax: 'Road tax' };
