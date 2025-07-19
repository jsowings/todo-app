-- Add archived column to projects table
ALTER TABLE projects 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Add archived column to tasks table  
ALTER TABLE tasks 
ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Create an index for better performance when filtering archived items
CREATE INDEX idx_projects_archived ON projects(user_id, archived);
CREATE INDEX idx_tasks_archived ON tasks(user_id, archived);

-- Optional: Add some comments to document the feature
COMMENT ON COLUMN projects.archived IS 'Whether this project is archived (soft deleted)';
COMMENT ON COLUMN tasks.archived IS 'Whether this task is archived (soft deleted)';
