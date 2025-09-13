# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Testing
- No test setup currently configured in the project

## Architecture

This is a **LocalSwap** hyperlocal marketplace app built with Next.js 15 (App Router), using a hybrid authentication and database approach.

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Authentication**: Firebase Auth with JWT tokens
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Maps**: Mapbox GL with react-map-gl
- **UI Components**: Radix UI primitives, Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toast library

### Key Architecture Patterns

#### Hybrid Auth System
- **Firebase Auth** handles user authentication and JWT token generation
- **Supabase** recognizes Firebase JWT tokens for database access
- Middleware in `src/middleware.ts` protects specific routes (currently excluding `/add-item`)
- Auth clients: `src/lib/firebase.ts` (Firebase) and `src/lib/supabase/` (Supabase)

#### Database Integration
- **Current State**: Chat system runs in mock mode (`src/lib/chatService.ts`)
- **Migration Ready**: Database schema in `supabase-complete-migration.sql`
- **Tables**: `items`, `conversations`, `messages`, plus storage bucket for images
- **Security**: Row Level Security policies configured for Firebase UIDs

#### App Structure
- `/` - Home page with item listings and map view
- `/add-item` - Item publication form (Firebase auth protected client-side)
- `/messages` - Chat system (currently mock data)
- `/my-items` - User's published items

### Configuration Files
- `tailwind.config.ts` - Uses Tailwind v4 with custom design system colors
- `src/app/layout.tsx` - Italian locale (`lang="it"`), PWA manifest, Geist fonts
- `src/lib/constants.ts` - App constants
- `src/lib/types.ts` - TypeScript interfaces
- `src/lib/validations.ts` - Zod schemas

### Database Setup
To activate real database (currently using mocks):
1. Run `supabase-complete-migration.sql` in Supabase SQL Editor
2. Configure environment variables as per `SUPABASE_SETUP.md`
3. Firebase Auth JWT integration is pre-configured

### Development Notes
- Uses Turbopack for faster builds and dev server
- Italian-focused app ("LocalSwap - Scambi nel vicinato")
- Location-based with 500m radius for hyperlocal exchanges
- PWA-ready with manifest and icons
- Images stored in Supabase storage bucket "items"

### Known Issues
- ESLint script in package.json lacks target specification
- Chat system pending database activation
- Some routes have different auth protection strategies