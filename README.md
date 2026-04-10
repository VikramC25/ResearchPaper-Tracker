# Research Paper Reading Tracker

A full-stack web application for tracking research papers, filtering your library, and viewing reading analytics.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + ShadCN/ui + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) installed and running

## Setup

### 1. Create the PostgreSQL database

Open a terminal and run:

```bash
psql -U postgres
CREATE DATABASE research_tracker;
\q
```

Or if using pgAdmin, create a database named `research_tracker`.

### 2. Configure the database connection

Edit `server/.env` and update the connection string if needed:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_tracker
```

Replace `postgres:postgres` with your PostgreSQL username and password.

### 3. Install server dependencies

```bash
cd server
npm install
```

### 4. Install client dependencies

```bash
cd client
npm install
```

## Running the App

### Start the backend (Terminal 1)

```bash
cd server
npm run dev
```

The server starts on http://localhost:3001

### Start the frontend (Terminal 2)

```bash
cd client
npm run dev
```

The app opens at http://localhost:5173

## Features

- **Add Paper**: Form to add papers with title, author, domain, reading stage, citation count, impact score, and date
- **Paper Library**: Browse all papers with multi-select filters (reading stage, domain, impact score, date range)
- **Reading Analytics**: Funnel chart, scatter plot, stacked bar chart, and summary statistics
