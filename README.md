# Document Upload UI

A file upload web application that uploads documents to MinIO (S3-compatible storage) using presigned URLs, designed to integrate with an n8n document processing pipeline.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.2.6 | Full-stack React framework with API routes |
| Language | TypeScript | ^5 | Type-safe development |
| UI Library | React | 19.2.4 | Component-based UI |
| Styling | Tailwind CSS | ^4 | Utility-first CSS framework |
| Icons | Lucide React | ^1.14.0 | SVG icon library |
| Storage SDK | AWS SDK S3 Client | ^3.967.0 | S3/MinIO presigned URL generation |
| Object Storage | MinIO | - | S3-compatible file storage |
| Font | Geist (Sans & Mono) | - | Typography via next/font |

## Architecture

```
Browser                    Next.js Server              MinIO
  │                            │                        │
  ├─ GET /api/presigned-url ──►│                        │
  │                            ├─ Generate presigned ──►│
  │◄── { url, key } ──────────┤                        │
  │                            │                        │
  ├─ PUT (presigned URL) ─────────────────────────────►│
  │    (direct upload with progress tracking)           │
```

1. Client requests a presigned PUT URL from the Next.js API route
2. API generates a time-limited (5 min) presigned URL via AWS SDK
3. Client uploads directly to MinIO using XHR (enables progress tracking)
4. Upload history is persisted in localStorage

## Project Structure

```
upload-ui/
├── app/
│   ├── api/presigned-url/route.ts   # API: generates presigned upload URLs
│   ├── components/
│   │   ├── FileList.tsx             # Upload history list
│   │   ├── ProgressBar.tsx          # Upload progress indicator
│   │   └── UploadZone.tsx           # Drag-and-drop file selector
│   ├── globals.css                  # Tailwind imports & theme
│   ├── layout.tsx                   # Root layout with fonts
│   └── page.tsx                     # Main upload page
├── lib/
│   └── s3-client.ts                 # S3Client singleton configuration
├── .env.local                       # Environment variables (not committed)
├── next.config.ts                   # Next.js configuration
├── package.json                     # Dependencies & scripts
└── tsconfig.json                    # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- MinIO instance running (or any S3-compatible storage)

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
MINIO_ENDPOINT=http://ip-server:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=n8n
MINIO_REGION=us-east-1
```

### Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Key Features

- **Drag & drop** file upload with multi-file support
- **Direct upload** to MinIO via presigned URLs (no server relay)
- **Real-time progress** tracking using XHR
- **Upload history** persisted in localStorage
- **Dark mode** support via CSS media query
