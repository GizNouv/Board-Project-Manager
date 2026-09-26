# Task Board

A full-stack Kanban-style task management application built with **Next.js, TypeScript, Clean Architecture, Prisma, and PostgreSQL**.

The project provides an interactive board-based workflow for managing tasks through customizable columns, task types, priorities, estimates, and drag-and-drop interactions.

> **Current status:** MVP completed and deployed to production.

---

## Overview

Task Board is a web-based task management application inspired by the Kanban workflow.

Users can create boards, organize them with columns, and manage tasks through an interactive drag-and-drop interface. The application is designed around a layered architecture that separates presentation, application logic, domain rules, and infrastructure concerns.

The current MVP focuses on a **single-user task management workflow**. Collaboration, real-time functionality, AI assistance, and other advanced capabilities are planned for future versions.

---

## Features

### Authentication

* User registration
* Email/password login
* Logout
* Session management
* Password hashing with `bcryptjs`
* Authentication handled through Auth.js

### Board Management

* Create boards
* View boards
* Edit board titles
* Delete boards

### Column Management

* Create columns
* Edit columns
* Delete columns
* Reorder columns with drag-and-drop

### Task Management

* Create tasks
* Edit tasks
* Delete tasks
* View task details
* Move tasks between columns
* Reorder tasks within a column
* Task types:

  * Feature
  * Bug
  * Epic
* Task priority
* Task estimate
* Bug severity
* Feature complexity

### Interactive Experience

* Drag-and-drop task management
* Drag-and-drop column reordering
* Optimistic UI updates
* Automatic rollback when server operations fail
* Toast notifications
* Responsive interface

---

## Architecture

The application follows a **Clean Architecture-inspired design** with four major layers:

```text
┌───────────────────────────────────────────┐
│              Presentation                 │
│                                           │
│ Next.js / React / Server Actions / API    │
│ Zustand / UI Components / D&D             │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│               Application                 │
│                                           │
│ Application Services / DTOs / Use Cases   │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│                  Domain                   │
│                                           │
│ Entities / Value Objects / Rules           │
│ Repository Interfaces / Exceptions        │
└─────────────────────▲─────────────────────┘
                      │
                      │ Implementations
┌─────────────────────┴─────────────────────┐
│              Infrastructure               │
│                                           │
│ Prisma / PostgreSQL / Auth.js             │
│ Repositories / Mappers / DI               │
└───────────────────────────────────────────┘
```

The main request flow can be summarized as:

```text
User
  ↓
Presentation
  ↓
Application Service
  ↓
Domain
  ↓
Repository Interface
  ↓
Repository Implementation
  ↓
Prisma
  ↓
PostgreSQL
```

This separation keeps the core domain independent from database and presentation technologies.

---

## Tech Stack

| Category         | Technology      |
| ---------------- | --------------- |
| Framework        | Next.js 16      |
| UI               | React 19        |
| Language         | TypeScript      |
| Styling          | Tailwind CSS 4  |
| UI Components    | shadcn/ui       |
| Client State     | Zustand         |
| Drag & Drop      | dnd-kit         |
| Forms            | React Hook Form |
| Validation       | Zod             |
| Authentication   | Auth.js         |
| Password Hashing | bcryptjs        |
| ORM              | Prisma          |
| Database         | PostgreSQL      |
| Database Hosting | Supabase        |
| Deployment       | Vercel          |
| Notifications    | Sonner          |
| Icons            | Lucide React    |

---

## Project Structure

The project is organized around the architectural layers described above.

```text
src/
├── app/
│   ├── ...
│   └── ...
│
├── components/
│   └── ...
│
└── core/
    ├── application/
    │   ├── dto/
    │   └── services/
    │
    ├── domain/
    │   ├── entities/
    │   ├── value-objects/
    │   ├── repositories/
    │   ├── exceptions/
    │   └── ...
    │
    └── infrastructure/
        ├── prisma/
        ├── repositories/
        ├── mappers/
        ├── auth/
        └── ...
```

The exact directory structure may evolve as the project continues beyond the MVP.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL database

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd task-board
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="your-postgresql-connection-string"

AUTH_SECRET="your-auth-secret"
```

Additional authentication or deployment variables may be required depending on the environment configuration.

> Never commit `.env` files or other secrets to the repository.

### Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

Apply the Prisma schema to the database:

```bash
npx prisma db push
```

If the project includes the database seed configuration, the development database can be populated using:

```bash
npm run seed
```

### Run the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Available Scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server.

```bash
npm run seed
```

Seeds the database with development data.

```bash
npx tsc --noEmit
```

Runs TypeScript type checking without emitting files.

---

## MVP Status

The current MVP includes the complete single-user Kanban workflow:

* [x] Authentication
* [x] Board CRUD
* [x] Column CRUD
* [x] Column reordering
* [x] Task CRUD
* [x] Feature / Bug / Epic task types
* [x] Task metadata
* [x] Task movement between columns
* [x] Task reordering
* [x] Drag-and-drop interactions
* [x] Optimistic updates
* [x] Rollback on failed operations
* [x] Toast notifications
* [x] Responsive interface
* [x] PostgreSQL persistence
* [x] Production deployment

---

## Roadmap

The current MVP provides the foundation for future development.

Planned capabilities include:

### Collaboration

* Workspaces
* Team members
* Invitations
* Role-based permissions
* Collaborative boards

### Real-Time Features

* Real-time board updates
* Multi-user synchronization
* Live activity indicators

### Advanced Task Management

* Comments
* Attachments
* Mentions
* Labels
* Due dates
* Activity history

### AI Assistance

Future versions may introduce an AI assistant for capabilities such as:

* Task creation assistance
* Task organization
* Task summaries
* Productivity insights
* Intelligent workflow suggestions

### Platform Features

* Analytics
* Administration
* Subscription management
* Payment integration
* Public API
* External service integrations

---

## Close Look

https://github.com/user-attachments/assets/6528045d-e786-4c03-936e-9da30dc36ab3

---

## Deployment

The MVP is deployed using:

```text
Browser
   ↓
Vercel / Next.js
   ↓
Prisma
   ↓
Supabase PostgreSQL
```

The production deployment provides the application runtime through Vercel and persistent PostgreSQL storage through Supabase.

---

## Project Documentation

Detailed project documentation is maintained separately from this README.

The documentation covers:

* System analysis
* Functional requirements
* Non-functional requirements
* Use cases
* System architecture
* UML diagrams
* Implementation details
* Testing and evaluation
* Future development

---
