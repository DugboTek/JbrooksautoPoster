# JBrooks Auto Poster - System Architecture

## 1. System Overview

JBrooks Auto Poster is a Next.js application that helps users generate, schedule, and manage LinkedIn posts. The system uses Supabase for authentication, database, and storage, with a React frontend powered by Next.js.

### High-level Architecture

```
┌─────────────────┐      ┌───────────────┐      ┌─────────────────┐
│                 │      │               │      │                 │
│  Next.js App    │<────>│  API Routes   │<────>│  Supabase       │
│  (React Client) │      │  (Serverless) │      │  (Auth/DB/Store)│
│                 │      │               │      │                 │
└─────────────────┘      └───────────────┘      └─────────────────┘
```

### Design Principles

- **Authentication-Focused**: Secure user data and access using Supabase Auth
- **Serverless Architecture**: Utilize Next.js API routes and Supabase for backend services
- **Progressive Enhancement**: Core functionality works with minimal JavaScript
- **Responsive Design**: Support for all device sizes

## 2. Component Documentation

### Directory Structure

```
JbrooksautoPoster/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── providers/       # Context providers
│   │   └── ProfileModal.tsx # User profile editing modal
│   ├── lib/
│   │   ├── supabase/        # Supabase clients and configuration
│   │   │   ├── client.ts    # Browser client configuration
│   │   │   ├── server.ts    # Server component client
│   │   │   ├── schema.sql   # Database schema definition
│   │   │   └── migrations/  # SQL migration files
│   │   └── utils/           # Utility functions
│   └── types/               # TypeScript type definitions
└── public/                  # Static assets
```

### Component Responsibilities

#### Supabase Integration

The application integrates with Supabase for:

1. **Authentication**: Email/password authentication with session management
2. **Database**: Storing user profiles, posts, and application settings
3. **Storage**: Storing user avatars and post attachments

#### Key Components:

- **SupabaseProvider**: Context provider that manages authentication state
- **ProfileButton**: Displays user avatar and triggers profile modal
- **ProfileModal**: Modal for editing user profile information, including avatar upload

### Data Flow

1. **Authentication Flow**: User authentication through Supabase Auth
2. **Profile Management Flow**: User profile data management through Supabase Database
3. **Avatar Management Flow**: User avatar storage through Supabase Storage

## 3. Technical Specifications

### Database Schema

#### Supabase Tables

1. **auth.users** (managed by Supabase)
   - Core authentication information

2. **public.user_profiles**
   - `id`: uuid (PK, references auth.users)
   - `full_name`: text
   - `company_name`: text
   - `website`: text
   - `goals`: text[]
   - `industry`: text
   - `job_title`: text
   - `avatar_url`: text
   - `created_at`: timestamp with time zone
   - `updated_at`: timestamp with time zone

### Supabase Storage

#### Buckets

1. **avatars**
   - Purpose: Store user profile pictures
   - Public Access: Enabled
   - Path Format: `{user_id}/avatar.{extension}`

### Row Level Security (RLS)

#### user_profiles Table

- **SELECT**: Users can only view their own profile (`auth.uid() = id`)
- **INSERT**: Users can only insert their own profile (`auth.uid() = id`)
- **UPDATE**: Users can only update their own profile (`auth.uid() = id`)

#### avatars Storage Bucket

- **SELECT**: Public access for all files
- **INSERT**: Users can only upload to their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)
- **UPDATE**: Users can only update files in their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)
- **DELETE**: Users can only delete files in their own folder (`auth.uid()::text = (storage.foldername(name))[1]`)

## 4. Development Guidelines

### Profile Feature Implementation

#### Frontend Components

1. **ProfileButton**
   - Located in dashboard header
   - Displays user avatar or default icon
   - Triggers ProfileModal on click

2. **ProfileModal**
   - Form for editing profile information
   - Fields for name, industry, job title
   - Avatar upload functionality

#### Backend Integration

1. **Supabase Client**
   - Used for database operations and file storage
   - Authentication state management

2. **Avatar Upload Process**
   - File validation client-side
   - Upload to Supabase Storage with path `{user_id}/avatar.{extension}`
   - Update user_profiles.avatar_url with public URL

### Testing Strategy

1. **Unit Tests**
   - Test form validation
   - Test component rendering

2. **Integration Tests**
   - Test form submission
   - Test file upload

3. **End-to-End Tests**
   - Test profile update flow
   - Test avatar upload and display

### Deployment Procedure

1. Apply database migrations
2. Deploy Next.js application
3. Verify Supabase configuration 