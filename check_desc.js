require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDesc() {
  const { data: itensZerados } = await supabase
    .from('historico_estoque_vendas')
    .select('codigo, descricao')
    .eq('estoque_loja', 0)
    .limit(5);

  console.log("Zerados in VENDAS:", itensZerados);
  
  // also check if they have descricao in historico_entradas
  const codigos = itensZerados.map(i => i.codigo.trim());
  const { data: entradas } = await supabase
    .from('historico_entradas')
    .select('codigo, descricao')
    .in('codigo', codigos);
    
  console.log("Entradas:", entradas);
}
checkDesc();
