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
- **Vehicle form:** create and edit buses and cars, with driver, fuel, FASTag, status, and notes fields. FASTag details are collected when availability is set to Yes.
- **Role-aware actions:** admins and managers can add, edit, and remove vehicles; operators have read-only access.

The API session is held in an HTTP-only cookie. The Context API exposes the current user and role-derived vehicle permissions to components; authorization is also enforced on the server.
