document.addEventListener('DOMContentLoaded', async () => {
  await iniciarLayout('conta');

  if (localStorage.getItem('ps_token_cliente')) {
    window.location.href = 'minha-conta.html';
    return;
  }

  document.getElementById('link-ir-cadastro').addEventListener('click', (ev) => {
    ev.preventDefault();
    document.getElementById('card-login').classList.add('hidden');
    document.getElementById('card-cadastro').classList.remove('hidden');
  });
  document.getElementById('link-ir-login').addEventListener('click', (ev) => {
    ev.preventDefault();
    document.getElementById('card-cadastro').classList.add('hidden');
    document.getElementById('card-login').classList.remove('hidden');
  });

  document.getElementById('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(ev.target));
    try {
      const { token, cliente } = await Api.post('/auth/clientes/login', dados);
      localStorage.setItem('ps_token_cliente', token);
      localStorage.setItem('ps_cliente_nome', cliente.nome);
      window.location.href = 'minha-conta.html';
    } catch (e) {
      document.getElementById('msg-login').innerHTML = `<div class="mensagem-erro">${esc(e.message)}</div>`;
    }
  });

  document.getElementById('form-cadastro').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(ev.target));
    try {
      const { token, cliente } = await Api.post('/auth/clientes/registrar', dados);
      localStorage.setItem('ps_token_cliente', token);
      localStorage.setItem('ps_cliente_nome', cliente.nome);
      window.location.href = 'minha-conta.html';
    } catch (e) {
      document.getElementById('msg-cadastro').innerHTML = `<div class="mensagem-erro">${esc(e.message)}</div>`;
    }
  });
});
