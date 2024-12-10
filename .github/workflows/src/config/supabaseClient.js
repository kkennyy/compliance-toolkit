import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jqatlsavtckslszcgbpc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxYXRsc2F2dGNrc2xzemNnYnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MDE0MDgsImV4cCI6MjA0OTM3NzQwOH0.5FqET-_PPpzEkbSR046BzXuNZGyGB9zQhNTTtD_X0S8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
