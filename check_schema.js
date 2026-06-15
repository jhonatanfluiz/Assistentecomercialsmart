require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data: cols1 } = await supabase.rpc('get_policies', {}); // Try to see if we can get schema info, or just query pg_class
  
  // A simpler way to get unique constraints is query pg_indexes or information_schema
  const { data: constraints, error } = await supabase.from('historico_entradas').select('id, codigo, data_movimento, quantidade').limit(10);
  console.log("Entradas:", constraints);
}
checkSchema();
