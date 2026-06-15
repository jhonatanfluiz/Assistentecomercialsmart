require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkData() {
  const { data: vendas } = await supabase.from('historico_estoque_vendas').select('codigo, loja').limit(5);
  console.log('VENDAS (amostra):', vendas);

  const { data: entradas } = await supabase.from('historico_entradas').select('codigo, local').limit(5);
  console.log('ENTRADAS (amostra):', entradas);
  
  // Vamos buscar os exatos codigos da imagem: 1190813, 1258210, 1216734
  const codigos = ['1190813', '1258210', '1216734'];
  const { data: entradasEspecificas } = await supabase.from('historico_entradas').select('*').in('codigo', codigos);
  console.log('Entradas para os códigos zerados:', entradasEspecificas);
}

checkData();
