import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="font-display text-3xl font-bold">You don't have access to this page</h1>
      <p className="mt-2 text-slate-600">Your role doesn't include this section. Ask the administrator if you need access.</p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-asphalt px-4 py-2 text-sm font-medium text-white hover:bg-asphalt-soft">
        Back to dashboard
      </Link>
    </div>
  );
}
