require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDesc2() {
  const codigos = ['1186663', '1190813', '1216734', '1258210'];
  const { data } = await supabase
    .from('historico_estoque_vendas')
    .select('codigo, descricao, loja')
    .in('codigo', codigos);

  console.log("All rows for these codes in VENDAS:", data);
}
checkDesc2();
