import { useState } from 'react';
import Field, { inputCls } from './Field';

// Password input with show/hide and an optional "Generate" button
export default function PasswordField({ label, value, onChange, error, hint, onGenerate, autoComplete = 'new-password', required }) {
  const [show, setShow] = useState(false);
  const small = 'rounded px-2 text-sm font-medium text-slate-600 hover:text-asphalt focus:outline-none focus-visible:ring-2 focus-visible:ring-signal';

  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`${inputCls(error)} ${onGenerate ? 'pr-32' : 'pr-16'}`}
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          {onGenerate && (
            <button type="button" onClick={() => { onGenerate(); setShow(true); }} className={small}>Generate</button>
          )}
          <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className={small}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
    </Field>
  );
}
