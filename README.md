# KGF Arena Turf Booking System - Deployment Guide

This project is a full-stack Node.js application using React (Vite) for the frontend and Express for the backend.

## 🚀 Quick Start (Local)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run in Development**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:3000`.

## 📦 Deployment Instructions

### 1. Hosting on Render / Railway (Recommended)

These platforms are the easiest for Node.js apps.

1.  **Connect GitHub**: Push your code to a GitHub repository and connect it to Render or Railway.
2.  **Build Command**: `npm install && npm run build`
3.  **Start Command**: `npm start`
4.  **Environment Variables**:
    *   `NODE_ENV`: `production`
    *   `PORT`: `3000` (or leave default)

### 2. Hosting with Docker

We have provided a `Dockerfile` for easy containerization.

1.  **Build Image**:
    ```bash
    docker build -t kgf-arena .
    ```
2.  **Run Container**:
    ```bash
    docker run -p 3000:3000 kgf-arena
    ```

### 3. Database Persistence (Important!)

The app uses **PostgreSQL**. You must provide a `DATABASE_URL` in your environment variables.

*   **Managed Database**: Use a service like **Supabase**, **Render Postgres**, or **Neon**.
*   **Local Development**: You can run Postgres locally or via Docker.

#### Environment Variable
Set the `DATABASE_URL` environment variable:
`DATABASE_URL=postgres://user:pass@host:port/db`

## 🛠 Admin Dashboard
Access the admin panel at `/admin`.
*   **Default User**: `admin`
*   **Default Pass**: `12345`

## 📁 Project Structure
*   `server.ts`: Express backend & API routes.
*   `src/`: React frontend source code.
*   `dist/`: Production build output (generated after `npm run build`).
*   `stadiumx.db`: SQLite database file.
