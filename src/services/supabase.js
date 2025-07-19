import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rwultasorjyfopmyxupd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dWx0YXNvcmp5Zm9wbXl4dXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTA5OTAsImV4cCI6MjA2Nzc2Njk5MH0.ckKA7YZYSKHHC3iSs3_KGAubjaXtWn_6uMWCWdoyNEg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);