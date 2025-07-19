# Archive Feature Setup

## Overview
The archive feature provides a safe way to "delete" projects without permanently losing data. When you click the X button on a project, it will be archived instead of permanently deleted.

## Database Setup

### Step 1: Run the Migration
Execute the SQL commands in `database/migrations/add_archived_columns.sql` in your Supabase SQL editor:

```sql
-- Add archived column to projects table
ALTER TABLE projects 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Add archived column to tasks table  
ALTER TABLE tasks 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX idx_projects_archived ON projects(user_id, archived);
CREATE INDEX idx_tasks_archived ON tasks(user_id, archived);
```

### Step 2: Verify Setup
After running the migration, verify it worked by checking your tables in Supabase:

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Check both `projects` and `tasks` tables
4. You should see a new `archived` column with type `bool` and default value `false`

## How It Works

### For Users:
1. **Archiving**: Click the X button on any project → Shows confirmation dialog → Project and all its tasks are archived
2. **Viewing Archives**: Click the "Archive" button in the header to see all archived projects
3. **Restoring**: In Archive view, click "Restore" to bring back a project and all its tasks
4. **Permanent Deletion**: In Archive view, click "Delete" for permanent removal (with double confirmation)

### Technical Details:
- **Soft Delete**: Projects are marked as `archived: true` instead of being deleted
- **Filtering**: Main views filter out archived items using `.neq('archived', true)`
- **Cascade Archive**: When a project is archived, all its tasks are also archived
- **Cascade Restore**: When a project is restored, all its tasks are also restored
- **Safety**: Multiple confirmation dialogs prevent accidental permanent deletion

## Benefits:
- ✅ **Safety**: No accidental data loss
- ✅ **Recoverable**: Can restore accidentally archived projects
- ✅ **Clean Interface**: Archived items don't clutter main views
- ✅ **Performance**: Indexes ensure filtering doesn't slow down queries
- ✅ **Audit Trail**: Archived items retain their creation/update timestamps

## User Experience:
- Changed X button from instant deletion to archive with confirmation
- Clear messaging: "Archive this project" instead of "Delete"
- Dedicated Archive view to manage archived items
- Visual indicators in archive view (opacity, archive icons)
- Destructive actions (permanent delete) require multiple confirmations
