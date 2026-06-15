require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTables() {
  console.log("Apagando dados da tabela historico_estoque_vendas...");
  const { error: error1 } = await supabase.from('historico_estoque_vendas').delete().neq('fabricante', 'IMPOSSIBLE_VALUE_TO_DELETE_ALL');
  if (error1) console.error("Erro em historico_estoque_vendas:", error1);
  else console.log("historico_estoque_vendas limpa!");
}

clearTables();
