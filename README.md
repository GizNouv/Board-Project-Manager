# Trello Clone

A Trello-inspired project management application built with Next.js 16, React 19, TypeScript, and modern web technologies.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: SQLite with Prisma ORM
- **Authentication**: Auth.js v5
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: dnd-kit

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Initialize database
npx prisma db push

# Start development server
npm run dev