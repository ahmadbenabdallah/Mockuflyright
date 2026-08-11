# Mockupify - Browser Mockup Generator

**Turn any website URL into a polished Safari browser mockup.**

Mockupify is a production-ready web application that converts website URLs into realistic macOS Safari, Chrome, or Firefox browser mockups and exports high-resolution PNGs or bulk ZIP archives.

---

## 🚀 Features

- **Realistic Safari Chrome**: Red/yellow/green traffic light buttons, SSL indicators, domain address bar, navigation arrows.
- **Customizable Canvas**: Gradient backgrounds, solid colors, transparent PNG alpha channels, customizable drop shadows, border radius (0–40px), and outer padding (0–100px).
- **Multi-Device Viewports**: Desktop (1440x900), Laptop (1280x800), Tablet (1024x1366), Mobile (390x844), or custom dimensions.
- **Full-Page Capture**: Progressive scroll trigger for lazy-loaded image capture.
- **High Resolution Export**: 1x, 2x (Retina), and 3x resolution output.
- **Bulk URL Processing**: Paste multiple URLs or upload `.csv` / `.txt` files with automatic duplicate removal and parallel worker concurrency.
- **ZIP Package Export**: Download all rendered mockups plus `results.csv` in a single ZIP file.
- **SSRF & Security**: Built-in SSRF protection blocking private IPv4/IPv6 ranges, internal hostnames, and metadata endpoints.

---

## 🏗️ Architecture

```text
Frontend (React + Tailwind + TypeScript)
   ↓
API Routes (/api/render, /api/bulk/create, /api/bulk/status)
   ↓
Rendering Queue & SSRF Validator
   ↓
Playwright Headless Browser Pipeline
   ↓
Screenshot Capture
   ↓
Canvas Image Composer (Header + Shadow + Background)
   ↓
PNG Export / JSZip Batch Output
```

---

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### 4. Build & Production Start

```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:
```env
RENDER_TIMEOUT=30000
MAX_BULK_URLS=100
MAX_CONCURRENCY=3
STORAGE_PROVIDER=local
```

---

## 📄 License

Apache-2.0
