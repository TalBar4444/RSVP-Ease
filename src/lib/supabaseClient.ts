import { createClient } from '@supabase/supabase-js';

// משיכת משתני הסביבה שהגדרנו בקובץ ה-.env.development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// בדיקת בטיחות קטנה כדי שלא נשכח להגדיר אותם
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

// יצירת הקליינט והצואתו לשימוש בשאר חלקי האפליקציה
export const supabase = createClient(supabaseUrl, supabaseAnonKey);