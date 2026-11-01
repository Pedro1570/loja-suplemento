const CAMPOS_TEXTO = ['nome_loja', 'telefone', 'whatsapp', 'instagram', 'endereco_loja', 'horario_funcionamento', 'taxa_entrega', 'prazo_retirada_horas', 'pix_chave'];
const CAMPOS_CHECKBOX = ['retirada_local_habilitada', 'entrega_habilitada', 'permitir_compra_visitante'];

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await iniciarAdmin('configuracoes');
  if (!usuario) return;

  const { config } = await Api.get('/config/admin', { tokenAdmin: true });

  CAMPOS_TEXTO.forEach((chave) => {
    const el = document.getElementById(`cfg-${chave}`);
    if (el) el.value = config[chave] || '';
  });
  CAMPOS_CHECKBOX.forEach((chave) => {
    const el = document.getElementById(`cfg-${chave}`);
    if (el) el.checked = config[chave] === 'true';
  });
  document.getElementById('badge-modo-gateway').textContent = config.gateway_modo || 'desenvolvimento';

  document.getElementById('form-config').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const payload = {};
    CAMPOS_TEXTO.forEach((chave) => { payload[chave] = document.getElementById(`cfg-${chave}`).value; });
    CAMPOS_CHECKBOX.forEach((chave) => { payload[chave] = document.getElementById(`cfg-${chave}`).checked ? 'true' : 'false'; });

    try {
      await Api.put('/config/admin', payload, { tokenAdmin: true });
      document.getElementById('msg-config').innerHTML = '<div class="mensagem-sucesso">Configurações salvas com sucesso!</div>';
    } catch (e) {
      document.getElementById('msg-config').innerHTML = `<div class="mensagem-erro">${esc(e.message)}</div>`;
    }
  });
});
