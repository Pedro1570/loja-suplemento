/**
 * Cliente HTTP central da loja. Todas as chamadas ao backend passam por
 * aqui, já cuidando de: URL base, JSON, token de autenticação e erros.
 */
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://api.cad-astro.com/api'; 

// Origem do backend sem o "/api" no final — usada para montar a URL
// completa de imagens enviadas (ex: /uploads/arquivo.jpg), já que o
// frontend e o backend costumam rodar em portas diferentes.
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

function urlArquivo(caminho) {
  if (!caminho) return '';
  if (/^https?:\/\//i.test(caminho)) return caminho; // já é uma URL completa
  return `${API_ORIGIN}${caminho}`;
}

const Api = {
  async _requisicao(caminho, opcoes = {}) {
    const token = opcoes.tokenCliente
      ? localStorage.getItem('ps_token_cliente')
      : opcoes.tokenAdmin
        ? localStorage.getItem('ps_token_admin')
        : null;

    const headers = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method: opcoes.method || 'GET',
      headers,
      body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
    });

    let dados;
    try { dados = await resposta.json(); } catch (e) { dados = {}; }

    if (!resposta.ok) {
      // Token expirado/inválido: limpa a sessão e manda para o login
      // correspondente, em vez de deixar a página travada com erros
      // silenciosos no console (o que acontecia antes).
      if (resposta.status === 401 && (opcoes.tokenAdmin || opcoes.tokenCliente)) {
        const noLogin = /login\.html$/.test(window.location.pathname);
        if (opcoes.tokenAdmin) {
          localStorage.removeItem('ps_token_admin');
          if (!noLogin) window.location.href = 'login.html';
        } else {
          localStorage.removeItem('ps_token_cliente');
          if (!noLogin) window.location.href = 'login.html';
        }
      }

      const erro = new Error(dados.mensagem || 'Erro ao comunicar com o servidor.');
      erro.status = resposta.status;
      erro.detalhes = dados.erros;
      throw erro;
    }
    return dados;
  },

  get(caminho, opcoes) { return this._requisicao(caminho, { ...opcoes, method: 'GET' }); },
  post(caminho, body, opcoes) { return this._requisicao(caminho, { ...opcoes, method: 'POST', body }); },
  put(caminho, body, opcoes) { return this._requisicao(caminho, { ...opcoes, method: 'PUT', body }); },
  patch(caminho, body, opcoes) { return this._requisicao(caminho, { ...opcoes, method: 'PATCH', body }); },
  delete(caminho, opcoes) { return this._requisicao(caminho, { ...opcoes, method: 'DELETE' }); }
};
