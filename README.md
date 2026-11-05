# PSG Transport Management — Client

React, React Router, Context API, Axios, and Tailwind CSS v4 frontend for the PSG Transport Management API.

## Run locally

1. Copy `env.example` to `.env` and set `VITE_API_URL` if your API is not at `http://localhost:3000/api`.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open the Vite URL shown in the terminal.

The backend must be running and an administrator account must already exist. See [the server setup](../server/README.md).

## Included screens and access

- **Sign in:** work-email/password form; accounts are provisioned by an administrator.
- **Fleet overview:** vehicle totals, status counts, search, and status filtering.
- **Vehicle form:** create and edit buses and cars, with fuel, FASTag, status, and notes fields. Driver allocation is managed separately from the vehicle master.
- **Vehicle Assign (transport officers/admins):** create date/time-window assignments from currently available vehicles and licensed drivers, review user requests, and assign or reject them. Overlapping assignments are prevented.
- **Vehicle Requests (transport users):** submit a purpose, route, passenger count, and date/time window; view the response and cancel a pending request.
- **My Trip Sheets (drivers):** view assigned trips and add multiple time-stamped daily trip entries with start/end odometer readings and optional fuel and notes. Entries do not close the assignment; a transport officer closes it when the overall trip is finished.
- **Role-aware actions:** admins and managers can add, edit, and remove vehicles; operators have read-only access.
- **Automatic sign-out:** signed-in users are logged out after 15 minutes without pointer, keyboard, touch, or scroll activity.

The API session is held in an HTTP-only cookie. The Context API exposes the current user and role-derived vehicle permissions to components; authorization is also enforced on the server.
