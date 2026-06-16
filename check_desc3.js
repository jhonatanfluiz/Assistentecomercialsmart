require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDesc3() {
  const codigos = ['1186663', '1190813', '1216734', '1258210'];
  const { data } = await supabase
    .from('historico_estoque_vendas')
    .select('codigo, descricao')
    .in('codigo', codigos)
    .neq('descricao', '')
    .limit(5);

  console.log("Rows with description in VENDAS:", data);
}
checkDesc3();
