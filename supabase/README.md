# Supabase Setup for FPL AI Advisor

This directory contains the database schema, RLS policies, and Edge Functions needed for the FPL AI Advisor application.

## Setup Instructions

### 1. Database Schema

Run the SQL migrations in order:

1. `supabase/migrations/001_initial_schema.sql` - Creates all necessary tables
2. `supabase/migrations/002_rls_policies.sql` - Sets up Row Level Security policies

### 2. Edge Functions

Deploy the Edge Functions:

1. `supabase/functions/create-user-profile/index.ts` - Creates user profiles after authentication
2. `supabase/functions/guest-access/index.ts` - Handles guest user access

### 3. Environment Variables

Set the following environment variables in your Supabase project:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for Edge Functions)

### 4. Local Development

To run Edge Functions locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link

# Start local development
supabase functions serve
```

### 5. Deployment

Deploy Edge Functions to your Supabase project:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy create-user-profile
supabase functions deploy guest-access
```

## Database Tables

### users
Extends auth.users with additional profile information
- id (UUID, primary key, references auth.users)
- email (TEXT, unique)
- name (TEXT)
- fpl_team_id (INTEGER)
- fpl_team_name (TEXT)
- is_guest (BOOLEAN)
- last_active_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### user_teams
Stores FPL team data for users
- id (UUID, primary key)
- user_id (UUID, foreign key)
- fpl_team_id (INTEGER)
- team_name (TEXT)
- current_squad (JSONB)
- bank_value (DECIMAL)
- team_value (DECIMAL)
- total_points (INTEGER)
- overall_rank (INTEGER)
- free_transfers (INTEGER)
- chips_used (JSONB)
- sync_status (TEXT)
- last_sync_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### user_notifications
Stores user notifications
- id (UUID, primary key)
- user_id (UUID, foreign key)
- type (TEXT)
- title (TEXT)
- message (TEXT)
- data (JSONB)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)

### user_events
Tracks user events for analytics
- id (UUID, primary key)
- user_id (UUID, foreign key)
- event_type (TEXT)
- event_data (JSONB)
- created_at (TIMESTAMP)

### leagues
Stores FPL league information
- id (UUID, primary key)
- fpl_league_id (INTEGER, unique)
- league_name (TEXT)
- league_type (TEXT)
- admin_user_id (UUID, foreign key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### league_memberships
Manages league memberships
- id (UUID, primary key)
- league_id (UUID, foreign key)
- user_id (UUID, foreign key)
- fpl_team_id (INTEGER)
- team_name (TEXT)
- joined_at (TIMESTAMP)

### advisor_chats
Stores AI advisor chat history
- id (UUID, primary key)
- user_id (UUID, foreign key)
- session_id (TEXT)
- messages (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### injury_data
Tracks player injury information
- id (UUID, primary key)
- player_id (INTEGER)
- player_name (TEXT)
- player_team (TEXT)
- injury_type (TEXT)
- expected_return (DATE)
- status (TEXT)
- source (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## Row Level Security (RLS)

All tables have RLS enabled with policies that:

1. Allow users to view/modify their own data
2. Allow authenticated users to create new records
3. Allow public read access to certain data (like injury data)
4. Ensure proper data isolation between users

## Edge Functions

### create-user-profile
Creates a user profile in the database after successful authentication.
- Triggered after user signup
- Creates profile in users table
- Records signup event

### guest-access
Handles guest user access for demo purposes.
- Creates or retrieves guest user
- Sets up demo team data
- Generates guest session token

## Security Considerations

1. All API routes use RLS policies to ensure data isolation
2. Service role key is only used in Edge Functions for admin operations
3. Guest access is limited to demo data
4. User authentication is handled through Supabase Auth
5. All sensitive operations require proper authentication