require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkEntradasSchema() {
  const { data: cols, error } = await supabase.from('historico_entradas').select('*').limit(1);
  console.log("Entradas schema:", Object.keys(cols[0] || {}));
}
checkEntradasSchema();
