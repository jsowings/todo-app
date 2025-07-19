-- Create week_assignments table for tracking weekly task assignments
CREATE TABLE IF NOT EXISTS week_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  
  -- Ensure unique assignment per task per date per user
  UNIQUE(user_id, task_id, assigned_date)
);

-- Create indexes for better performance
CREATE INDEX idx_week_assignments_user_id ON week_assignments(user_id);
CREATE INDEX idx_week_assignments_task_id ON week_assignments(task_id);
CREATE INDEX idx_week_assignments_assigned_date ON week_assignments(assigned_date);
CREATE INDEX idx_week_assignments_user_date ON week_assignments(user_id, assigned_date);

-- Enable Row Level Security (RLS)
ALTER TABLE week_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own week assignments"
  ON week_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own week assignments"
  ON week_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own week assignments"
  ON week_assignments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own week assignments"
  ON week_assignments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_week_assignments_updated_at
  BEFORE UPDATE ON week_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();