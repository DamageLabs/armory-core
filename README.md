# Armory Core

Armory Core is an Open Source Inventory Management System designed to track firearms, accessories, and ammunition. It helps you manage your collection, monitor stock levels, and track accessory configurations.

## Project Status

This project is currently in an early alpha stage. This is a React + TypeScript full-stack application.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- React Bootstrap (UI framework)
- React Router v6 (routing)
- Express + better-sqlite3 (backend)

## Installation

```bash
npm install
npm run dev
```

This will install all dependencies and start the development server at http://localhost:5173 with the backend at http://localhost:3001.

## Default Credentials

**Admin User**
```
username: admin@example.com
password: changeme
```

**Regular User**
```
username: user@example.com
password: changeme
```

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test:run` - Run tests

## Features

- User authentication with role-based access control
- Inventory item management (CRUD)
- Per-type custom field schemas (Firearms, Accessories, Ammunition)
- Parent-child item relationships (e.g., optic mounted on a rifle)
- Sortable and paginated item list
- Image upload support
- Admin user management
- Category-based organization
- Bill of Materials (BOM) tracking
- Stock movement history
- Cost history and trend analysis
- Barcode/QR code label printing
- CSV import/export
