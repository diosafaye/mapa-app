import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ejtfprjfdlzsfkzbnpvp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdGZwcmpmZGx6c2ZremJucHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODA2NTIsImV4cCI6MjA5MTY1NjY1Mn0.VM-M31Idhbfxgznd_AcpRRgNvy2H8SiiIyZaG5ealu8'

export const supabase = createClient(supabaseUrl, supabaseKey)