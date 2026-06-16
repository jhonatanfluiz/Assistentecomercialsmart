require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function alterTable() {
  const { data, error } = await supabase.rpc('execute_sql', {
    query: 'ALTER TABLE historico_entradas ADD COLUMN pedido VARCHAR(255);'
  });
  console.log("Alter table:", error || "Success");
}
alterTable();
