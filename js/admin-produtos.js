let CATEGORIAS_ADMIN = [];
let MARCAS_ADMIN = [];

async function carregarSelects() {
  const { categorias } = await Api.get('/categorias/admin', { tokenAdmin: true });
  const { marcas } = await Api.get('/marcas/admin', { tokenAdmin: true });
  CATEGORIAS_ADMIN = categorias;
  MARCAS_ADMIN = marcas;

  document.getElementById('produto-categoria').innerHTML = '<option value="">Selecione</option>' + categorias.map((c) => `<option value="${Number(c.id)}">${esc(c.nome)}</option>`).join('');
  document.getElementById('produto-marca').innerHTML = '<option value="">Selecione</option>' + marcas.map((m) => `<option value="${Number(m.id)}">${esc(m.nome)}</option>`).join('');
  document.getElementById('filtro-categoria-admin').innerHTML = '<option value="">Todas categorias</option>' + categorias.map((c) => `<option value="${esc(c.slug)}">${esc(c.nome)}</option>`).join('');
}

async function carregarTabelaProdutos() {
  const busca = document.getElementById('busca-produto-admin').value;
  const categoria = document.getElementById('filtro-categoria-admin').value;
  const query = new URLSearchParams({ limite: 100 });
  if (busca) query.set('busca', busca);
  if (categoria) query.set('categoria', categoria);

  const { itens } = await Api.get(`/produtos/admin/todos?${query.toString()}`, { tokenAdmin: true });
  const corpo = document.getElementById('tabela-produtos-admin');

  corpo.innerHTML = itens.map((p) => `
    <tr>
      <td>${p.imagem ? `<img src="${esc(urlArquivo(p.imagem))}" alt="" onerror="this.style.display='none'">` : ''}</td>
      <td>${esc(p.nome)}</td>
      <td>${esc(p.sku)}</td>
      <td>${esc(p.categoria_nome || '-')}</td>
      <td>${formatarPreco(p.preco_promocional || p.preco)}</td>
      <td>${Number(p.estoque)}</td>
      <td><span class="status-pill ${p.status === 'ativo' ? 'status-pagamento_aprovado' : 'status-cancelado'}">${esc(p.status)}</span></td>
      <td>
        <button class="btn btn-secundario btn-sm" data-acao="editar" data-id="${Number(p.id)}">Editar</button>
        <button class="btn btn-ghost btn-sm" data-acao="status" data-id="${Number(p.id)}">${p.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
        <button class="btn btn-ghost btn-sm" data-acao="excluir" data-id="${Number(p.id)}" style="color:var(--vermelho)">Excluir</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="8" class="txt-cinza text-center">Nenhum produto cadastrado.</td></tr>';

  corpo.querySelectorAll('button[data-acao]').forEach((btn) => {
    btn.addEventListener('click', () => tratarAcaoProduto(btn.dataset.acao, btn.dataset.id, itens));
  });
}

function abrirModalProduto(produto = null) {
  document.getElementById('titulo-modal-produto').textContent = produto ? 'Editar produto' : 'Novo produto';
  document.getElementById('produto-id').value = produto?.id || '';
  document.getElementById('produto-nome').value = produto?.nome || '';
  document.getElementById('produto-sku').value = produto?.sku || '';
  document.getElementById('produto-categoria').value = produto?.categoria_id || '';
  document.getElementById('produto-marca').value = produto?.marca_id || '';
  document.getElementById('produto-descricao').value = produto?.descricao || '';
  document.getElementById('produto-nutricao').value = produto?.informacoes_nutricionais || '';
  document.getElementById('produto-preco').value = produto?.preco || '';
  document.getElementById('produto-preco-promo').value = produto?.preco_promocional || '';
  document.getElementById('produto-peso').value = produto?.peso || '';
  document.getElementById('produto-estoque').value = produto?.estoque ?? '';
  document.getElementById('produto-estoque-minimo').value = produto?.estoque_minimo ?? 5;

  document.getElementById('msg-upload-imagem').textContent = '';
  document.getElementById('produto-imagem-arquivo').value = '';

  // O bloco de foto agora aparece sempre — tanto para criar quanto para
  // editar. Ao criar, a foto escolhida é enviada automaticamente logo
  // depois que o produto é salvo (veja salvarProduto).
  const blocoImagem = document.getElementById('bloco-imagem-produto');
  const preview = document.getElementById('preview-imagem-produto');
  blocoImagem.classList.remove('hidden');
  blocoImagem.dataset.produtoId = produto?.id || '';

  if (produto?.imagem) {
    preview.src = urlArquivo(produto.imagem);
    preview.style.display = 'block';
  } else {
    preview.src = '';
    preview.style.display = 'none';
  }

  document.getElementById('modal-produto').classList.add('aberto');
}
function fecharModalProduto() { document.getElementById('modal-produto').classList.remove('aberto'); }

// Mostra uma prévia local (sem precisar enviar nada ao servidor ainda)
// assim que o usuário escolhe um arquivo, tanto ao criar quanto ao editar.
function prevViewImagemLocal() {
  const arquivo = document.getElementById('produto-imagem-arquivo').files[0];
  if (!arquivo) return;
  const preview = document.getElementById('preview-imagem-produto');
  preview.src = URL.createObjectURL(arquivo);
  preview.style.display = 'block';
}

async function enviarImagemProduto(produtoIdForcado) {
  const produtoId = produtoIdForcado || document.getElementById('bloco-imagem-produto').dataset.produtoId;
  const arquivo = document.getElementById('produto-imagem-arquivo').files[0];
  const msgEl = document.getElementById('msg-upload-imagem');

  if (!produtoId) {
    msgEl.innerHTML = '<span class="badge-erro">Salve o produto primeiro para poder enviar a foto.</span>';
    return;
  }
  if (!arquivo) {
    msgEl.innerHTML = '<span class="badge-erro">Escolha um arquivo primeiro.</span>';
    return;
  }

  const formData = new FormData();
  formData.append('imagem', arquivo);
  formData.append('principal', 'true');

  msgEl.textContent = 'Enviando...';
  try {
    const resposta = await fetch(`${API_BASE_URL}/produtos/${produtoId}/imagem`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('ps_token_admin')}` },
      body: formData
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.mensagem || 'Erro ao enviar imagem.');

    document.getElementById('preview-imagem-produto').src = urlArquivo(dados.url);
    document.getElementById('preview-imagem-produto').style.display = 'block';
    msgEl.innerHTML = '<span class="txt-verde">Imagem enviada com sucesso!</span>';
    carregarTabelaProdutos();
    return dados;
  } catch (e) {
    msgEl.innerHTML = `<span class="badge-erro">${esc(e.message)}</span>`;
    throw e;
  }
}

async function tratarAcaoProduto(acao, id, itens) {
  try {
    if (acao === 'editar') {
      const produto = itens.find((i) => String(i.id) === id);
      abrirModalProduto(produto);
    }
    if (acao === 'status') {
      await Api.patch(`/produtos/${id}/status`, {}, { tokenAdmin: true });
      carregarTabelaProdutos();
    }
    if (acao === 'excluir') {
      if (!confirm('Tem certeza que deseja excluir este produto?')) return;
      await Api.delete(`/produtos/${id}`, { tokenAdmin: true });
      carregarTabelaProdutos();
    }
  } catch (e) {
    alert(e.message);
  }
}

async function salvarProduto(ev) {
  ev.preventDefault();
  const idAtual = document.getElementById('produto-id').value;
  const payload = {
    nome: document.getElementById('produto-nome').value,
    sku: document.getElementById('produto-sku').value,
    categoriaId: document.getElementById('produto-categoria').value || null,
    marcaId: document.getElementById('produto-marca').value || null,
    descricao: document.getElementById('produto-descricao').value,
    informacoesNutricionais: document.getElementById('produto-nutricao').value,
    preco: Number(document.getElementById('produto-preco').value),
    precoPromocional: document.getElementById('produto-preco-promo').value ? Number(document.getElementById('produto-preco-promo').value) : null,
    peso: document.getElementById('produto-peso').value,
    estoque: Number(document.getElementById('produto-estoque').value),
    estoqueMinimo: Number(document.getElementById('produto-estoque-minimo').value)
  };

  const botaoSalvar = ev.target.querySelector('button[type="submit"]');
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Salvando...';

  try {
    let produtoId = idAtual;

    if (idAtual) {
      await Api.put(`/produtos/${idAtual}`, payload, { tokenAdmin: true });
    } else {
      const { produto } = await Api.post('/produtos', payload, { tokenAdmin: true });
      produtoId = produto.id;
    }

    // Se uma foto foi escolhida (na criação ou na edição), envia agora
    // que já temos certeza do ID do produto — tudo em um único clique.
    const arquivo = document.getElementById('produto-imagem-arquivo').files[0];
    if (arquivo) {
      botaoSalvar.textContent = 'Enviando foto...';
      await enviarImagemProduto(produtoId);
    }

    fecharModalProduto();
    carregarTabelaProdutos();
  } catch (e) {
    alert(e.message);
  } finally {
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = 'Salvar produto';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await iniciarAdmin('produtos');
  if (!usuario) return;

  await carregarSelects();
  await carregarTabelaProdutos();

  document.getElementById('btn-novo-produto').addEventListener('click', () => abrirModalProduto());
  document.getElementById('btn-cancelar-produto').addEventListener('click', fecharModalProduto);
  document.getElementById('form-produto').addEventListener('submit', salvarProduto);
  document.getElementById('produto-imagem-arquivo').addEventListener('change', prevViewImagemLocal);
  document.getElementById('btn-upload-imagem-produto').addEventListener('click', () => enviarImagemProduto());
  document.getElementById('busca-produto-admin').addEventListener('input', () => carregarTabelaProdutos());
  document.getElementById('filtro-categoria-admin').addEventListener('change', () => carregarTabelaProdutos());
});
