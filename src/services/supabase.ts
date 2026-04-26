import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export default { supabaseAdmin, supabaseAnon };