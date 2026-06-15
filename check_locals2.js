require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkLocals() {
  const { data: vendas } = await supabase.from('historico_estoque_vendas').select('loja');
  const lojasUnicas = [...new Set(vendas.map(v => v.loja))];
  console.log('LOJAS UNICAS EM VENDAS:', lojasUnicas);

  const { data: entradas } = await supabase.from('historico_entradas').select('local');
  const locaisUnicos = [...new Set(entradas.map(e => e.local))];
  console.log('LOCAIS UNICOS EM ENTRADAS:', locaisUnicos);
}

checkLocals();
