/* Andaluria Wiki — plugin do Guia do Caçador
   Blocos: ficha, cartoes, mapa, relacionados, navegacao
   Extras: página inicial ao abrir, botões na lateral, zoom de imagem */
const { Plugin, MarkdownRenderer, MarkdownRenderChild, TFile, parseYaml, Notice, setIcon, Modal, Setting, normalizePath, requestUrl, Platform } = require('obsidian');

const PADRAO = {
  inicio: 'Início', mapa: 'Mapa de Andaluria', cache: '_midia/gravuras', abrirInicio: true,
  botoes: { inicio: true, mapa: true, aleatoria: true, nova: true },
  secoes: null, secaoPorTipo: null,
  derivar: false, tiposPorTag: [], indicePorTag: [], ignorar: [], ondePorPasta: false, pastas: {}, erguer: false,
  icones: false, ambiente: null, migracoes: [], novos: {}, pastaLugares: 'Lugares',
};
const TIPOS = {
  lugar:    { rotulo: 'Lugar',     icone: 'map-pin' },
  pessoa:   { rotulo: 'Pessoa',    icone: 'user' },
  faccao:   { rotulo: 'Facção',    icone: 'shield' },
  criatura: { rotulo: 'Bestiário', icone: 'skull' },
  mundo:    { rotulo: 'O Mundo',   icone: 'book-open' },
  cacador:  { rotulo: 'Caçador',   icone: 'swords' },
  diario:   { rotulo: 'Diário de Caça', icone: 'scroll' },
  item:     { rotulo: 'Arsenal',   icone: 'sword' },
  guia:     { rotulo: 'Guia',      icone: 'compass' },
  trama:    { rotulo: 'Trama',     icone: 'eye' },
  regra:    { rotulo: 'Regras',    icone: 'book-marked' },
};
const SECOES_PADRAO = [
  ['Início', 'home', 'Início'],
  ['O Mundo', 'book-open', 'O Mundo'],
  ['Lugares', 'map-pin', 'Lugares'],
  ['Mapa', 'map', 'Mapa de Andaluria'],
  ['Pessoas', 'users', 'Pessoas'],
  ['Facções', 'shield', 'Facções'],
  ['Bestiário', 'skull', 'Bestiário'],
  ['Caçadores', 'swords', 'Os Caçadores'],
  ['Diário', 'scroll', 'Diário de Caça'],
];

const MODELOS = {
  pessoa:   { rotulo: 'Pessoa (alguém que o grupo conheceu)', pasta: '3 - Pessoas', sub: 'Pessoa', ficha: ['Papel', 'Onde encontrar', 'Situação'], corpo: '## Quem é\n\n\n## O que sabemos\n\n- \n\n## O que ainda não sabemos\n\n- \n' },
  lugar:    { rotulo: 'Lugar', pasta: '2 - Lugares', sub: 'Lugar', ficha: ['Tipo', 'Região'], corpo: '## Como é\n\n\n## O que aconteceu aqui\n\n- \n' },
  criatura: { rotulo: 'Criatura (algo que o grupo enfrentou)', pasta: '5 - Bestiário', sub: 'Criatura', ficha: ['Onde foi vista', 'Fraqueza'], corpo: '## O que é\n\n\n## Como age\n\n- \n\n## Fraquezas\n\n- \n' },
  faccao:   { rotulo: 'Facção ou grupo', pasta: '4 - Facções', sub: 'Grupo', ficha: ['Sede', 'Quem manda'], corpo: '## O que é\n\n\n## O que quer\n\n- \n' },
  diario:   { rotulo: 'Registro de sessão', pasta: '7 - Diário de Caça', sub: 'Registro de sessão', ficha: ['Data'], corpo: '## O que aconteceu\n\n\n## Quem conhecemos\n\n- \n\n## O que descobrimos\n\n- \n\n## Para a próxima\n\n- \n' },
};
class NovaPagina extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.tipo = 'pessoa'; this.nome = ''; this.resumo = ''; this.img = ''; }
  onOpen() {
    const { contentEl } = this; contentEl.addClass('aw-modal');
    contentEl.createEl('h2', { text: 'Nova página' });
    new Setting(contentEl).setName('O que é?').addDropdown(d => { for (const k in MODELOS) d.addOption(k, MODELOS[k].rotulo); d.setValue(this.tipo); d.onChange(v => this.tipo = v); });
    new Setting(contentEl).setName('Nome').addText(t => { t.setPlaceholder('Ex.: Dona Inês, a padeira'); t.onChange(v => this.nome = v); setTimeout(() => t.inputEl.focus(), 50); t.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.criar(); }); });
    new Setting(contentEl).setName('Uma frase sobre').setDesc('Aparece nos cartões e no topo da página.').addText(t => { t.onChange(v => this.resumo = v); t.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.criar(); }); });
    new Setting(contentEl).setName('Imagem (opcional)').setDesc('Cole o link de uma imagem da internet. Pode deixar em branco.').addText(t => { t.setPlaceholder('https://...'); t.onChange(v => this.img = v); });
    new Setting(contentEl).addButton(b => b.setButtonText('Criar página').setCta().onClick(() => this.criar()));
  }
  async criar() {
    const nome = this.nome.replace(/[\\/:*?"<>|#^\[\]]/g, '').trim();
    if (!nome) { new Notice('Dê um nome para a página.'); return; }
    const mo = MODELOS[this.tipo];
    const caminho = normalizePath(mo.pasta + '/' + nome + '.md');
    if (this.app.vault.getAbstractFileByPath(caminho)) { new Notice('Já existe uma página com esse nome.'); this.close(); this.app.workspace.openLinkText(caminho, '', false); return; }
    if (!this.app.vault.getAbstractFileByPath(mo.pasta)) await this.app.vault.createFolder(mo.pasta).catch(() => {});
    const q = (s) => JSON.stringify(String(s));
    const fm = ['---', 'tipo: ' + this.tipo, 'subtipo: ' + q(mo.sub)];
    if (this.resumo.trim()) fm.push('resumo: ' + q(this.resumo.trim()));
    if (this.img.trim()) fm.push('imagem: ' + q(this.img.trim()));
    fm.push('ordem: 50', '---', '```ficha'); for (const c of mo.ficha) fm.push(c + ': ');
    fm.push('```', '', mo.corpo, '```relacionados', '```', '');
    const f = await this.app.vault.create(caminho, fm.join('\n'));
    this.close();
    const folha = this.app.workspace.getLeaf(false);
    await folha.openFile(f, { state: { mode: 'source' } });
    new Notice('Página criada. Preencha os campos da ficha depois dos dois-pontos e escreva à vontade. O livro, no canto superior direito, volta para a leitura.', 9000);
  }
  onClose() { this.contentEl.empty(); }
}

function yaml(src) {
  try { const o = parseYaml(src || ''); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
}
function lista(v) { if (v == null) return []; return Array.isArray(v) ? v : [v]; }
function semLink(s) { return String(s == null ? '' : s).replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1'); }
function iniciais(nome) {
  const p = String(nome || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(w => w && !/^(de|da|do|dos|das|e|o|a|os|as|del|em)$/i.test(w));
  return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
}

class AndaluriaWiki extends Plugin {
  async onload() {
    let salvo = null; try { salvo = await this.loadData(); } catch (e) {}
    this.cfg = Object.assign({}, PADRAO, salvo || {});
    this.cfg.botoes = Object.assign({}, PADRAO.botoes, (salvo && salvo.botoes) || {});
    if (!this.cfg.secoes) this.cfg.secoes = SECOES_PADRAO;
    if (!this.cfg.secaoPorTipo) this.cfg.secaoPorTipo = { lugar: 'Lugares', pessoa: 'Pessoas', faccao: 'Facções', criatura: 'Bestiário', item: 'Bestiário', mundo: 'O Mundo', cacador: 'Os Caçadores', diario: 'Diário de Caça' };
    this.registerMarkdownCodeBlockProcessor('ficha', (src, el, ctx) => this.bloco(el, ctx, (c) => this.ficha(src, el, ctx, c)));
    this.registerMarkdownCodeBlockProcessor('cartoes', (src, el, ctx) => this.bloco(el, ctx, () => this.cartoes(src, el, ctx)));
    this.registerMarkdownCodeBlockProcessor('mapa', (src, el, ctx) => this.bloco(el, ctx, () => this.mapa(src, el, ctx), false));
    this.registerMarkdownCodeBlockProcessor('relacionados', (src, el, ctx) => this.bloco(el, ctx, () => this.relacionados(src, el, ctx)));
    this.registerMarkdownCodeBlockProcessor('navegacao', (src, el, ctx) => this.bloco(el, ctx, () => this.navegacao(el, ctx), false));

    const B = this.cfg.botoes;
    if (B.inicio) this.addRibbonIcon('home', 'Início', () => this.abrir(this.cfg.inicio));
    if (B.mapa) this.addRibbonIcon('map', 'Mapa de Andaluria', () => this.abrir(this.cfg.mapa));
    if (B.aleatoria) this.addRibbonIcon('dices', 'Página aleatória', () => this.aleatoria());
    if (B.nova) {
      this.addRibbonIcon('file-plus', 'Nova página', () => new NovaPagina(this.app, this).open());
      this.addCommand({ id: 'nova', name: 'Nova página', callback: () => new NovaPagina(this.app, this).open() });
    }
    this.addCommand({ id: 'inicio', name: 'Ir para o Início', callback: () => this.abrir(this.cfg.inicio) });
    this.addCommand({ id: 'mapa', name: 'Abrir o mapa', callback: () => this.abrir(this.cfg.mapa) });
    this.addCommand({ id: 'aleatoria', name: 'Página aleatória', callback: () => this.aleatoria() });

    // zoom de imagem
    this.registerDomEvent(document, 'click', (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLImageElement)) return;
      if (!t.closest('.markdown-reading-view, .markdown-rendered')) return;
      if (t.closest('a, .aw-card, .aw-mapa, .aw-lightbox, .aw-nozoom')) return;
      this.lightbox(t.src, t.getAttribute('alt') || t.dataset.legenda || '');
    });

    this.extras();
    this.app.workspace.onLayoutReady(() => {
      const temNota = this.app.workspace.getLeavesOfType('markdown').some(l => l.view && l.view.file);
      if (!temNota && this.cfg.abrirInicio) this.abrir(this.cfg.inicio);
      window.setTimeout(() => this.preCarregar(), 4000);
    });
  }

  /* ---------- ilustrações: baixa uma vez e guarda no vault ---------- */
  nomeCache(url) {
    let h = 5381; for (let i = 0; i < url.length; i++) h = (((h << 5) + h) + url.charCodeAt(i)) >>> 0;
    const m = url.split('?')[0].match(/\.(jpe?g|png|gif|webp)$/i);
    return this.cfg.cache + '/' + h.toString(16) + '.' + (m ? m[1].toLowerCase() : 'jpg');
  }
  baixar(url) {
    if (!this.fila) { this.fila = []; this.pedidos = new Set(); this.ativos = 0; this.salvos = 0; }
    if (this.pedidos.has(url)) return;
    this.pedidos.add(url); this.fila.push(url); this.bombear();
  }
  bombear() {
    while (this.ativos < 2 && this.fila.length) {
      const url = this.fila.shift(); this.ativos++;
      this.guardar(url).catch(() => {}).finally(() => {
        this.ativos--;
        if (!this.fila.length && !this.ativos && this.salvos) { new Notice('Ilustrações guardadas no vault (' + this.salvos + '). Agora elas abrem sem internet.'); this.salvos = 0; }
        setTimeout(() => this.bombear(), 350);
      });
    }
  }
  async guardar(url) {
    const nome = this.nomeCache(url);
    if (this.app.vault.getAbstractFileByPath(nome)) return;
    let r = null;
    for (let t = 0; t < 4; t++) {
      r = await requestUrl({ url, throw: false });
      if (r.status !== 429) break;
      await new Promise(ok => window.setTimeout(ok, 15000 * (t + 1)));
    }
    if (!r || r.status !== 200 || !r.arrayBuffer || r.arrayBuffer.byteLength < 3000) return;
    const tipo = String((r.headers && (r.headers['content-type'] || r.headers['Content-Type'])) || '');
    if (tipo && !/^image\//i.test(tipo)) return;
    if (!this.app.vault.getAbstractFileByPath(this.cfg.cache)) await this.app.vault.createFolder(this.cfg.cache).catch(() => {});
    await this.app.vault.createBinary(nome, r.arrayBuffer);
    this.salvos++;
  }
  preCarregar() {
    for (const f of this.app.vault.getMarkdownFiles()) {
      const m = this.fm(f);
      for (const k of ['capa', 'imagem']) { const v = m[k] && semLink(m[k]).trim(); if (v && /^https?:\/\//i.test(v) && !this.app.vault.getAbstractFileByPath(this.nomeCache(v))) this.baixar(v); }
    }
  }

  /* ---------- utilidades ---------- */
  bloco(el, ctx, desenhar, atualizar = true) {
    const filho = new MarkdownRenderChild(el);
    ctx.addChild(filho);
    const seguro = () => { try { el.empty(); desenhar(filho); } catch (e) { console.error('Andaluria Wiki', e); el.setText('Não foi possível montar este bloco.'); } };
    el._awFilho = filho;
    if (!this.vivos) this.vivos = new Set();
    this.vivos.add(seguro); filho.register(() => this.vivos.delete(seguro));
    seguro();
    if (atualizar) {
      let t = null;
      filho.registerEvent(this.app.metadataCache.on('resolved', () => { clearTimeout(t); t = setTimeout(seguro, 400); }));
    }
  }
  arquivo(nome, origem) {
    if (!nome) return null;
    const f = this.app.metadataCache.getFirstLinkpathDest(semLink(nome).trim(), origem || '');
    return f instanceof TFile ? f : null;
  }
  fm(f) {
    const c = f && this.app.metadataCache.getFileCache(f);
    const b = (c && c.frontmatter) || {};
    const cfg = this.cfg;
    if (!f || !cfg.derivar) return b;
    const m = Object.assign({}, b);
    const tags = lista(b.tags).map(t => String(t).replace(/^#/, ''));
    if (!m.tipo) for (const [tag, tipo] of cfg.tiposPorTag) if (tags.includes(tag)) { m.tipo = tipo; break; }
    if (m.indice == null && tags.some(t => cfg.indicePorTag.includes(t))) m.indice = true;
    if (cfg.ignorar.some(p => f.path.startsWith(p))) { m.oculto = true; m.indice = true; }
    if (cfg.ondePorPasta) {
      const extra = [];
      for (const p of f.path.split('/').slice(0, -1)) {
        if ((cfg.pastasIgnorar || []).some(r => new RegExp(r).test(p))) continue;
        const nome = Object.prototype.hasOwnProperty.call(cfg.pastas, p) ? cfg.pastas[p] : p;
        if (nome && nome !== f.basename) extra.push(nome);
      }
      if (extra.length) m.onde = lista(m.onde).concat(extra);
    }
    return m;
  }
  abrir(nome, novaAba) {
    const f = this.arquivo(nome, '');
    if (!f) { new Notice('Página não encontrada: ' + nome); return; }
    this.app.workspace.openLinkText(f.path, '', !!novaAba);
  }
  aleatoria() {
    const fs = this.app.vault.getMarkdownFiles().filter(f => { const m = this.fm(f); return m.tipo && !m.indice && !m.oculto; });
    if (fs.length) this.app.workspace.openLinkText(fs[Math.floor(Math.random() * fs.length)].path, '', false);
  }
  src(valor, origem) {
    if (!valor) return null;
    const v = semLink(valor).trim();
    if (/^https?:\/\//i.test(v)) {
      const nome = this.nomeCache(v);
      const local = this.app.vault.getAbstractFileByPath(nome);
      if (local instanceof TFile) return { url: this.app.vault.getResourcePath(local), remota: true };
      this.baixar(v);
      return { url: v, remota: true };
    }
    const f = this.arquivo(v, origem);
    return f ? { url: this.app.vault.getResourcePath(f), remota: false } : null;
  }
  imagem(pai, valor, origem, nome, classe, foco) {
    const s = this.src(valor, origem);
    const caixa = pai.createDiv({ cls: 'aw-img ' + (classe || '') });
    const marca = () => { caixa.empty(); caixa.addClass('aw-semimg'); caixa.createSpan({ cls: 'aw-monograma', text: iniciais(nome) }); };
    if (!s) { marca(); return caixa; }
    const img = caixa.createEl('img', { attr: { src: s.url, alt: nome || '', loading: 'lazy', referrerpolicy: 'no-referrer' } });
    if (s.remota) img.addClass('aw-gravura');
    if (foco) img.style.objectPosition = String(foco);
    else if (classe === 'aw-card-img' && !caixa.closest('.aw-retrato')) img.addEventListener('load', () => { if (img.naturalHeight > img.naturalWidth * 1.1) img.style.objectPosition = '50% 20%'; });
    img.addEventListener('error', marca);
    return caixa;
  }
  link(pai, f, texto, origem, cls) {
    const a = pai.createEl('a', { cls: 'internal-link ' + (cls || ''), text: texto, attr: { href: f.path, 'data-href': f.path } });
    a.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.app.workspace.openLinkText(f.path, origem || '', ev.ctrlKey || ev.metaKey); });
    a.addEventListener('mouseover', (ev) => { this.app.workspace.trigger('hover-link', { event: ev, source: 'preview', hoverParent: { hoverPopover: null }, targetEl: a, linktext: f.path, sourcePath: origem || '' }); });
    return a;
  }
  ligar(el, origem) {
    el.querySelectorAll('a.internal-link').forEach(a => {
      if (a._aw) return; a._aw = true;
      a.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.app.workspace.openLinkText(a.getAttribute('data-href') || a.getAttribute('href'), origem, ev.ctrlKey || ev.metaKey); });
      a.addEventListener('mouseover', (ev) => { this.app.workspace.trigger('hover-link', { event: ev, source: 'preview', hoverParent: { hoverPopover: null }, targetEl: a, linktext: a.getAttribute('data-href') || a.getAttribute('href'), sourcePath: origem || '' }); });
    });
  }
  async md(texto, el, origem, filho) {
    await MarkdownRenderer.render(this.app, String(texto), el, origem, filho);
    const p = el.querySelector(':scope > p');
    if (p && el.children.length === 1) { while (p.firstChild) el.appendChild(p.firstChild); p.remove(); }
    this.ligar(el, origem);
    if (this.decorar) this.decorar(el, origem);
  }
  lightbox(src, legenda) {
    const fundo = document.body.createDiv({ cls: 'aw-lightbox' });
    fundo.createEl('img', { attr: { src } });
    if (legenda) fundo.createDiv({ cls: 'aw-lightbox-legenda', text: legenda });
    const fechar = () => { fundo.remove(); document.removeEventListener('keydown', tecla); };
    const tecla = (e) => { if (e.key === 'Escape') fechar(); };
    fundo.addEventListener('click', fechar);
    document.addEventListener('keydown', tecla);
  }

  /* ---------- barra de navegação ---------- */
  navegacao(el, ctx, ativo) {
    const nav = el.createDiv({ cls: 'aw-nav' });
    for (const [rotulo, icone, nota] of this.cfg.secoes) {
      const f = this.arquivo(nota, ctx.sourcePath);
      if (!f) continue;
      const a = this.link(nav, f, '', ctx.sourcePath, 'aw-nav-item');
      setIcon(a.createSpan({ cls: 'aw-nav-icone' }), icone);
      a.createSpan({ text: rotulo });
      if (f.path === ctx.sourcePath || ativo === nota) a.addClass('is-ativo');
    }
    return nav;
  }

  /* ---------- ficha: capa + título + caixa de informações ---------- */
  ficha(src, el, ctx, filho) {
    const f = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    const m = Object.assign({}, this.fm(f), yaml(src));
    const titulo = m.titulo || (f ? f.basename : '');
    const tipo = TIPOS[m.tipo] || null;
    el.addClass('aw-ficha');

    const secao = m.secao || this.cfg.secaoPorTipo[m.tipo];
    this.navegacao(el, ctx, secao);

    const temCapa = !!this.src(m.capa, ctx.sourcePath);
    const topo = el.createDiv({ cls: 'aw-topo' + (temCapa ? ' tem-capa' : '') + (m.indice ? ' aw-indice' : '') });
    if (temCapa) {
      const s = this.src(m.capa, ctx.sourcePath);
      const img = topo.createEl('img', { cls: 'aw-capa aw-nozoom' + (s.remota ? ' aw-gravura' : ''), attr: { src: s.url, alt: '', referrerpolicy: 'no-referrer' } });
      if (m.capa_foco) img.style.objectPosition = String(m.capa_foco);
      else img.addEventListener('load', () => { if (img.naturalHeight > img.naturalWidth * 1.1) img.style.objectPosition = '50% 22%'; });
      img.addEventListener('error', () => { img.remove(); topo.removeClass('tem-capa'); });
      topo.createDiv({ cls: 'aw-capa-sombra' });
    }
    const txt = topo.createDiv({ cls: 'aw-topo-texto' });
    const trilha = txt.createDiv({ cls: 'aw-trilha' });
    if (tipo) setIcon(trilha.createSpan({ cls: 'aw-trilha-icone' }), tipo.icone);
    const sf = secao && this.arquivo(secao, ctx.sourcePath);
    if (sf && sf.path !== ctx.sourcePath) { this.link(trilha, sf, secao, ctx.sourcePath); if (m.subtipo) trilha.createSpan({ text: ' · ' + semLink(m.subtipo) }); }
    else if (m.subtipo) trilha.createSpan({ text: semLink(m.subtipo) });
    else if (tipo) trilha.createSpan({ text: tipo.rotulo });
    txt.createEl('h1', { cls: 'aw-titulo', text: titulo });
    if (m.resumo) { const r = txt.createDiv({ cls: 'aw-resumo' }); this.md(m.resumo, r, ctx.sourcePath, filho); }
    if (this.cfg.ambiente && m.tipo === 'lugar' && !m.indice) {
      const af = this.arquivo(this.cfg.ambiente, ctx.sourcePath);
      if (af) { const b = this.link(topo, af, '', ctx.sourcePath, 'aw-ambiente'); setIcon(b.createSpan(), 'music'); b.createSpan({ text: 'Ambiente' }); }
    }

    const campos = m.ficha && typeof m.ficha === 'object' ? Object.entries(m.ficha) : [];
    const RESERVADAS = ['tipo', 'titulo', 'subtipo', 'resumo', 'capa', 'capa_foco', 'imagem', 'imagem_foco', 'legenda', 'secao', 'onde', 'faccao', 'grupo', 'ordem', 'indice', 'ficha', 'link_ficha', 'aliases', 'tags'];
    for (const [k, v] of Object.entries(yaml(src))) if (!RESERVADAS.includes(k)) campos.push([k, v]);
    const erguer = this.cfg.erguer && !m.indice;
    if (m.imagem || campos.length || erguer) {
      const caixa = el.createEl('aside', { cls: 'aw-infobox' + (m.tipo ? ' aw-' + m.tipo : '') });
      caixa.createDiv({ cls: 'aw-infobox-titulo', text: titulo });
      if (m.imagem) {
        const fig = this.imagem(caixa, m.imagem, ctx.sourcePath, titulo, 'aw-infobox-img', m.imagem_foco);
        const im = fig.querySelector('img'); if (im && m.legenda) im.dataset.legenda = semLink(m.legenda);
        if (m.legenda) caixa.createDiv({ cls: 'aw-legenda', text: semLink(m.legenda) });
      }
      const tb = caixa.createEl('table', { cls: 'aw-campos' });
      for (const [k, v] of campos) {
        if (v == null || v === '') continue;
        const tr = tb.createEl('tr');
        tr.createEl('th', { text: k });
        const td = tr.createEl('td');
        this.md(lista(v).map(x => Array.isArray(x) ? '[[' + x.flat(5).join('') + ']]' : String(x)).join(' · '), td, ctx.sourcePath, filho);
      }
      if (m.link_ficha) caixa.createEl('a', { cls: 'aw-botao external-link', text: 'Abrir a ficha de personagem', attr: { href: String(m.link_ficha), target: '_blank', rel: 'noopener' } });
      const ajustar = () => { caixa.toggleClass('aw-oculto', !m.imagem && !tb.rows.length && !m.link_ficha); };
      ajustar();
      if (erguer) this.erguer(el, tb, titulo, ctx.sourcePath, ajustar, 0);
    }
  }

  /* ---------- traz para a caixa a tabela (ou a linha "Tipo: ...") que abre a nota ---------- */
  erguer(el, tb, titulo, origem, ajustar, n) {
    if (!el.isConnected && n > 6) return;
    if (el.closest('.markdown-source-view')) return;
    const sec = el.closest('.markdown-preview-sizer > div, .markdown-embed-content > div, .markdown-rendered > div');
    const de_novo = () => { if (n < 6) window.setTimeout(() => this.erguer(el, tb, titulo, origem, ajustar, n + 1), 60 + 120 * n); };
    if (!sec) return de_novo();
    const norm = (s) => String(s || '').trim().toLowerCase();
    let s = sec.nextElementSibling;
    while (s && s.matches('.mod-header, .mod-footer')) s = s.nextElementSibling;
    if (s) { const h1 = s.querySelector(':scope > h1'); if (h1 && norm(h1.textContent) === norm(titulo)) { s.addClass('aw-oculto'); s = s.nextElementSibling; } }
    if (!s) return de_novo();
    const linha = (rotulo, nos) => {
      const tmp = createDiv(); nos.forEach(x => tmp.appendChild(x.cloneNode(true)));
      const limpa = (no, ini) => { if (no && no.nodeType === 3) no.textContent = ini ? no.textContent.replace(/^[\s·:]+/, '') : no.textContent.replace(/[\s·]+$/, ''); };
      limpa(tmp.firstChild, true); limpa(tmp.lastChild, false);
      if (!tmp.textContent.trim()) return;
      const tr = tb.createEl('tr'); tr.createEl('th', { text: rotulo.replace(/:\s*$/, '') });
      const td = tr.createEl('td'); while (tmp.firstChild) td.appendChild(tmp.firstChild);
    };
    const t = s.querySelector('table');
    const p = s.querySelector(':scope > p');
    if (t && t.rows.length && t.rows[0].cells.length === 2 && !norm(t.rows[0].textContent)) {
      for (const tr of Array.from(t.rows).slice(1)) { if (tr.cells.length < 2) continue; linha(tr.cells[0].textContent.trim(), Array.from(tr.cells[1].childNodes)); }
      s.addClass('aw-oculto');
    } else if (p && p.firstElementChild && p.firstChild === p.firstElementChild && p.firstElementChild.tagName === 'STRONG' && /:\s*$/.test(p.firstElementChild.textContent)) {
      let rot = null, nos = [];
      for (const no of Array.from(p.childNodes)) {
        if (no.nodeType === 1 && no.tagName === 'STRONG' && /:\s*$/.test(no.textContent)) { if (rot) linha(rot, nos); rot = no.textContent.trim(); nos = []; }
        else nos.push(no);
      }
      if (rot) linha(rot, nos);
      s.addClass('aw-oculto');
    }
    this.ligar(tb, origem);
    ajustar();
  }

  /* ---------- cartões ---------- */
  cartoes(src, el, ctx) {
    const o = yaml(src);
    let fs = [];
    if (o.lista) {
      fs = lista(o.lista).map(n => this.arquivo(n, ctx.sourcePath)).filter(Boolean);
    } else {
      fs = this.app.vault.getMarkdownFiles().filter(f => {
        if (f.path === ctx.sourcePath) return false;
        const m = this.fm(f);
        if (m.oculto) return false;
        if (m.indice && !o.indices) return false;
        if (o.pasta && !f.path.startsWith(String(o.pasta).replace(/\/?$/, '/'))) return false;
        if (o.tipo && !lista(o.tipo).includes(m.tipo)) return false;
        if (o.subtipo && !lista(o.subtipo).some(s => String(m.subtipo || '').toLowerCase().includes(String(s).toLowerCase()))) return false;
        for (const chave of ['onde', 'faccao', 'grupo']) {
          if (!o[chave]) continue;
          const alvo = semLink(o[chave]).toLowerCase();
          if (!lista(m[chave]).some(x => semLink(x).toLowerCase() === alvo)) return false;
        }
        return !!(o.pasta || o.tipo || o.onde || o.faccao || o.grupo);
      });
      fs.sort((a, b) => {
        const oa = this.fm(a).ordem, ob = this.fm(b).ordem;
        if (oa != null || ob != null) return (oa == null ? 999 : oa) - (ob == null ? 999 : ob);
        return a.basename.localeCompare(b.basename, 'pt');
      });
    }
    if (!fs.length) { if (o.vazio) el.createDiv({ cls: 'aw-vazio', text: String(o.vazio) }); return; }
    const estilo = o.estilo || 'paisagem';
    const grade = el.createDiv({ cls: 'aw-cartoes aw-' + estilo });
    if (o.colunas) grade.style.setProperty('--aw-colunas', String(o.colunas));
    for (const f of fs) {
      const m = this.fm(f);
      const card = grade.createDiv({ cls: 'aw-card' });
      const img = estilo === 'retrato' ? (m.imagem || m.capa) : (m.capa || m.imagem);
      if (estilo !== 'lista') this.imagem(card, img, f.path, m.titulo || f.basename, 'aw-card-img', estilo === 'retrato' ? m.imagem_foco : (m.capa ? m.capa_foco : null));
      const c = card.createDiv({ cls: 'aw-card-corpo' });
      if (m.subtipo && estilo !== 'compacto') c.createDiv({ cls: 'aw-card-sub', text: semLink(m.subtipo) });
      this.link(c, f, m.titulo || f.basename, ctx.sourcePath, 'aw-card-titulo');
      if (m.resumo && o.resumo !== false) c.createDiv({ cls: 'aw-card-resumo', text: semLink(m.resumo).replace(/\*\*/g, '') });
      card.addEventListener('click', (ev) => { if (ev.target.closest('a')) return; this.app.workspace.openLinkText(f.path, ctx.sourcePath, ev.ctrlKey || ev.metaKey); });
    }
  }

  /* ---------- aparece em ---------- */
  relacionados(src, el, ctx) {
    const o = yaml(src);
    const rl = this.app.metadataCache.resolvedLinks || {};
    const fs = [];
    for (const origem in rl) {
      if (origem === ctx.sourcePath) continue;
      if (rl[origem] && rl[origem][ctx.sourcePath]) {
        const f = this.app.vault.getAbstractFileByPath(origem);
        if (f instanceof TFile && !this.fm(f).indice) fs.push(f);
      }
    }
    if (!fs.length) return;
    fs.sort((a, b) => a.basename.localeCompare(b.basename, 'pt'));
    const caixa = el.createDiv({ cls: 'aw-relacionados' });
    caixa.createDiv({ cls: 'aw-relacionados-titulo', text: o.titulo || 'Aparece em' });
    const chips = caixa.createDiv({ cls: 'aw-chips' });
    for (const f of fs) {
      const m = this.fm(f); const t = TIPOS[m.tipo];
      const a = this.link(chips, f, '', ctx.sourcePath, 'aw-chip');
      if (t) setIcon(a.createSpan({ cls: 'aw-chip-icone' }), t.icone);
      a.createSpan({ text: m.titulo || f.basename });
    }
  }

  /* ---------- mapa com pinos ---------- */
  mapa(src, el, ctx) {
    const o = yaml(src);
    const s = this.src(o.imagem, ctx.sourcePath);
    if (!s) { el.setText('Imagem do mapa não encontrada.'); return; }
    const W = Number(o.largura) || 3173, H = Number(o.altura) || 2454;
    const raiz = el.createDiv({ cls: 'aw-mapa' });
    const barra = raiz.createDiv({ cls: 'aw-mapa-barra' });
    const janela = raiz.createDiv({ cls: 'aw-mapa-janela' });
    const palco = janela.createDiv({ cls: 'aw-mapa-palco' });
    palco.style.aspectRatio = W + ' / ' + H;
    janela.style.aspectRatio = W + ' / ' + H;
    palco.createEl('img', { attr: { src: s.url, alt: 'Mapa de Andaluria', draggable: 'false' } });
    let z = 1, x = 0, y = 0;
    const aplicar = () => {
      const jw = janela.clientWidth, jh = janela.clientHeight, pw = jw * z, ph = pw * H / W;
      x = Math.min(0, Math.max(jw - pw, x)); y = ph <= jh ? (jh - ph) / 2 : Math.min(0, Math.max(jh - ph, y));
      palco.style.width = pw + 'px'; palco.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      raiz.style.setProperty('--aw-z', String(z));
    };
    const zoom = (fator, cx, cy) => {
      const jw = janela.clientWidth, jh = janela.clientHeight;
      cx = cx == null ? jw / 2 : cx; cy = cy == null ? jh / 2 : cy;
      const nz = Math.min(5, Math.max(1, z * fator));
      x = cx - (cx - x) * (nz / z); y = cy - (cy - y) * (nz / z); z = nz; aplicar();
    };
    const bt = (icone, dica, fn) => { const b = barra.createEl('button', { cls: 'aw-mapa-bt', attr: { 'aria-label': dica } }); setIcon(b, icone); b.addEventListener('click', fn); };
    bt('zoom-in', 'Aproximar', () => zoom(1.4));
    bt('zoom-out', 'Afastar', () => zoom(1 / 1.4));
    bt('maximize', 'Ver tudo', () => { z = 1; x = 0; y = 0; aplicar(); });
    barra.createSpan({ cls: 'aw-mapa-dica', text: 'Arraste para mover · role para aproximar · clique num ponto para abrir' });
    janela.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = janela.getBoundingClientRect(); zoom(ev.deltaY < 0 ? 1.2 : 1 / 1.2, ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
    let arr = null, moveu = false;
    janela.addEventListener('pointerdown', (ev) => { if (ev.target.closest('.aw-pino')) return; arr = { px: ev.clientX, py: ev.clientY, x, y }; moveu = false; janela.setPointerCapture(ev.pointerId); janela.addClass('arrastando'); });
    janela.addEventListener('pointermove', (ev) => { if (!arr) return; x = arr.x + ev.clientX - arr.px; y = arr.y + ev.clientY - arr.py; moveu = true; aplicar(); });
    const soltar = () => { arr = null; janela.removeClass('arrastando'); };
    janela.addEventListener('pointerup', soltar); janela.addEventListener('pointercancel', soltar);

    const legenda = raiz.createDiv({ cls: 'aw-mapa-legenda' });
    const pinos = lista(o.pinos);
    pinos.forEach((p, i) => {
      const f = this.arquivo(p.nota, ctx.sourcePath);
      const n = p.n != null ? p.n : i + 1;
      const nome = p.nome || (f ? (this.fm(f).titulo || f.basename) : semLink(p.nota));
      const pino = palco.createDiv({ cls: 'aw-pino' });
      pino.style.left = (100 * p.x / W) + '%'; pino.style.top = (100 * p.y / H) + '%';
      pino.createSpan({ cls: 'aw-pino-n', text: String(n) });
      pino.createSpan({ cls: 'aw-pino-nome', text: nome });
      const ir = (ev) => { if (f) this.app.workspace.openLinkText(f.path, ctx.sourcePath, ev.ctrlKey || ev.metaKey); };
      pino.addEventListener('click', ir);
      const item = legenda.createDiv({ cls: 'aw-mapa-item' });
      item.createSpan({ cls: 'aw-pino-n', text: String(n) });
      const tx = item.createDiv();
      if (f) this.link(tx, f, nome, ctx.sourcePath, 'aw-mapa-nome'); else tx.createSpan({ cls: 'aw-mapa-nome', text: nome });
      const resumo = p.resumo || (f ? this.fm(f).resumo : '');
      if (resumo) tx.createDiv({ cls: 'aw-mapa-resumo', text: semLink(resumo).replace(/\*\*/g, '') });
      item.addEventListener('mouseenter', () => pino.addClass('destaque'));
      item.addEventListener('mouseleave', () => pino.removeClass('destaque'));
      pino.addEventListener('mouseenter', () => item.addClass('destaque'));
      pino.addEventListener('mouseleave', () => item.removeClass('destaque'));
    });
    const ro = new ResizeObserver(() => aplicar()); ro.observe(janela);
    el._awFilho && el._awFilho.register(() => ro.disconnect());
    setTimeout(aplicar, 50);
  }
}
module.exports = AndaluriaWiki;

/* ===================== v1.2: mesa do mestre ===================== */
const MORTO = /\b(mort[oa]s?|desaparecid[oa]s?|destru[ií]d[oa]s?|extint[oa]s?)\b/i;
function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

class NovaNota extends Modal {
  constructor(app, plugin, tipo) { super(app); this.plugin = plugin; this.tipo = tipo; this.v = {}; }
  onOpen() {
    const { contentEl } = this; const P = this.plugin; const def = P.cfg.novos[this.tipo];
    contentEl.addClass('aw-modal');
    contentEl.createEl('h2', { text: def.rotulo || 'Nova nota' });
    if (def.sessao) {
      const n = P.proximaSessao();
      contentEl.createEl('p', { text: 'Cria o registro "Sessão ' + n + '" e a "Preparação ' + n + '", e acrescenta a linha no índice.' });
      new Setting(contentEl).setName('Data real').addText(t => { t.inputEl.type = 'date'; t.onChange(v => this.v.data = v); });
    } else {
      new Setting(contentEl).setName('Nome').addText(t => { t.onChange(v => this.v.nome = v); setTimeout(() => t.inputEl.focus(), 50); t.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.criar(); }); });
      const pastas = P.pastasDeLugar();
      new Setting(contentEl).setName(def.novaPasta ? 'Dentro de' : 'Lugar').setDesc(def.novaPasta ? 'Um lugar novo ganha pasta própria; dentro de outro, fica na pasta dele.' : 'A nota é salva na pasta deste lugar.').addDropdown(d => {
        if (def.novaPasta) d.addOption('', '(lugar novo, com pasta própria)');
        for (const p of pastas) d.addOption(p, p.replace(P.cfg.pastaLugares + '/', ''));
        this.v.pasta = def.novaPasta ? '' : (pastas[0] || ''); d.setValue(this.v.pasta); d.onChange(v => this.v.pasta = v);
      });
      for (const [chave, rot, dica] of (def.campos || [])) new Setting(contentEl).setName(rot).addText(t => { if (dica) t.setPlaceholder(dica); t.onChange(v => this.v[chave] = v); t.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') this.criar(); }); });
    }
    new Setting(contentEl).addButton(b => b.setButtonText('Criar').setCta().onClick(() => this.criar()));
  }
  async criar() {
    try { const f = await this.plugin.criarNota(this.tipo, this.v); if (f) { this.close(); await this.app.workspace.getLeaf(false).openFile(f); } }
    catch (e) { console.error(e); new Notice('Não deu para criar: ' + e.message); }
  }
  onClose() { this.contentEl.empty(); }
}

Object.assign(AndaluriaWiki.prototype, {
  extras() {
    this.info = {}; this.vivos = this.vivos || new Set();
    const B = (nome, fn, atualizar) => this.registerMarkdownCodeBlockProcessor(nome, (src, el, ctx) => this.bloco(el, ctx, (c) => fn.call(this, src, el, ctx, c), atualizar));
    B('site', this.site, false); B('lista', this.listaAuto, true); B('novo', this.novo, false); B('sortear', this.sortear, false);
    B('viagem', this.viagem, false); B('painel', this.painel, true); B('linha-do-tempo', this.linhaDoTempo, true); B('mudancas', this.mudancas, true); B('ganchos', this.ganchos, true);
    if (this.cfg.icones) this.registerMarkdownPostProcessor((el, ctx) => this.decorar(el, ctx.sourcePath));
    this.registerEvent(this.app.vault.on('modify', (f) => { if (f instanceof TFile && f.extension === 'md') this.lerInfo(f); }));
    this.app.workspace.onLayoutReady(async () => {
      await this.migrar();
      await Promise.all(this.app.vault.getMarkdownFiles().map(f => this.lerInfo(f)));
      this.redesenhar();
    });
  },
  redesenhar() {
    for (const fn of Array.from(this.vivos || [])) { try { fn(); } catch (e) {} }
    if (this.cfg.icones) document.querySelectorAll('.markdown-rendered').forEach(el => this.decorar(el, ''));
  },
  async lerInfo(f) {
    try {
      const t = await this.app.vault.cachedRead(f);
      const m = t.match(/\*\*Status\*\*\s*\|\s*(.*?)\s*\|/) || t.match(/\*\*Status:\*\*\s*([^·\n]*)/);
      const st = m ? semLink(m[1]).replace(/\*/g, '').trim() : '';
      this.info[f.path] = { status: st, apagado: MORTO.test(st) || lista(this.fm(f).tags).includes('morto') };
    } catch (e) {}
  },
  async migrar() {
    for (const mg of this.cfg.migracoes || []) {
      try {
        const f = this.app.vault.getAbstractFileByPath(mg.de);
        if (!(f instanceof TFile) || this.app.vault.getAbstractFileByPath(mg.para)) continue;
        const pasta = mg.para.split('/').slice(0, -1).join('/');
        if (pasta && !this.app.vault.getAbstractFileByPath(pasta)) await this.app.vault.createFolder(pasta).catch(() => {});
        await this.app.fileManager.renameFile(f, mg.para);
      } catch (e) { console.error('Andaluria Wiki: migração', mg, e); }
    }
    for (const p of this.cfg.limparPastas || []) {
      const d = this.app.vault.getAbstractFileByPath(p);
      if (d && d.children && !d.children.length) await this.app.vault.trash(d, true).catch(() => {});
    }
  },

  /* ---------- ícone por tipo antes de cada link ---------- */
  decorar(raiz, origem) {
    if (!this.cfg.icones || !raiz || !raiz.querySelectorAll) return;
    raiz.querySelectorAll('a.internal-link').forEach(a => {
      if (a.closest('.aw-nav, .aw-card, .aw-chips, .aw-trilha, .aw-mapa, .aw-ambiente, .aw-lista-nome, .aw-lt')) return;
      const alvo = (a.getAttribute('data-href') || a.getAttribute('href') || '').split('#')[0].split('|')[0];
      if (!alvo) return;
      const f = this.app.metadataCache.getFirstLinkpathDest(alvo, origem || '');
      if (!(f instanceof TFile)) return;
      const inf = this.info[f.path];
      a.toggleClass('aw-apagado', !!(inf && inf.apagado));
      if (a.dataset.awIc) return;
      const t = TIPOS[this.fm(f).tipo];
      if (!t) return;
      a.dataset.awIc = '1';
      const s = createSpan({ cls: 'aw-li' }); setIcon(s, t.icone); a.prepend(document.createTextNode('\u2060')); a.prepend(s);
    });
  },

  /* ---------- site embutido ---------- */
  site(src, el, ctx) {
    const o = yaml(src); const url = String(o.url || '').trim();
    if (!/^https?:\/\//i.test(url)) { el.setText('Bloco site: falta a linha "url: https://..."'); return; }
    const caixa = el.createDiv({ cls: 'aw-site' });
    const barra = caixa.createDiv({ cls: 'aw-site-barra' });
    barra.createSpan({ cls: 'aw-site-titulo', text: o.titulo || url.replace(/^https?:\/\//, '').replace(/\/$/, '') });
    let quadro;
    const bt = (icone, dica, fn) => { const b = barra.createEl('button', { cls: 'aw-mapa-bt', attr: { 'aria-label': dica } }); setIcon(b, icone); b.addEventListener('click', fn); return b; };
    const desktop = !(Platform && Platform.isMobile);
    if (o.abrir === 'clique' && !el._awAberto) {
      const b = caixa.createEl('button', { cls: 'aw-novo-bt aw-site-abrir' }); setIcon(b.createSpan(), 'play'); b.createSpan({ text: 'Abrir aqui' });
      b.addEventListener('click', () => { el._awAberto = true; el.empty(); this.site(src, el, ctx); });
      const b2 = barra.createEl('button', { cls: 'aw-mapa-bt', attr: { 'aria-label': 'Abrir no navegador' } }); setIcon(b2, 'external-link'); b2.addEventListener('click', () => window.open(url));
      return;
    }
    if (desktop) {
      quadro = document.createElement('webview');
      quadro.setAttribute('src', url); quadro.setAttribute('partition', 'persist:andaluria'); quadro.setAttribute('allowpopups', '');
      if (o.zoom) quadro.addEventListener('dom-ready', () => { try { quadro.setZoomFactor(Number(o.zoom)); } catch (e) {} });
    } else {
      quadro = document.createElement('iframe'); quadro.setAttribute('src', url); quadro.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
    }
    quadro.addClass('aw-site-quadro'); quadro.style.height = String(o.altura || '80vh');
    bt('home', 'Voltar ao endereço inicial', () => { if (desktop && quadro.loadURL) quadro.loadURL(url); else quadro.setAttribute('src', url); });
    bt('rotate-cw', 'Recarregar', () => { try { desktop ? quadro.reload() : quadro.setAttribute('src', quadro.getAttribute('src')); } catch (e) {} });
    bt('panel-top-open', 'Abrir numa aba do Obsidian', async () => {
      try { await this.app.workspace.getLeaf('tab').setViewState({ type: 'webviewer', active: true, state: { url, navigate: true } }); }
      catch (e) { window.open(url); }
    });
    bt('external-link', 'Abrir no navegador', () => window.open(url));
    caixa.appendChild(quadro);
  },

  /* ---------- tabela automática ---------- */
  listaAuto(src, el, ctx) {
    const o = yaml(src);
    const cols = lista(o.colunas).length ? lista(o.colunas) : ['nome', 'papel', 'lugar'];
    const ROT = { nome: 'Nota', papel: 'Papel', subtipo: 'Tipo', faccao: 'Facção', lugar: 'Lugar', status: 'Status', resumo: 'Resumo', alterada: 'Alterada' };
    let fs = this.app.vault.getMarkdownFiles().filter(f => {
      if (f.path === ctx.sourcePath) return false;
      const m = this.fm(f);
      if (m.oculto || m.indice) return false;
      if (o.pasta && !f.path.startsWith(String(o.pasta).replace(/\/?$/, '/'))) return false;
      if (o.tipo && !lista(o.tipo).includes(m.tipo)) return false;
      if (o.tag && !lista(m.tags).some(t => lista(o.tag).includes(String(t)))) return false;
      return !!(o.pasta || o.tipo || o.tag);
    });
    fs.sort((a, b) => a.basename.localeCompare(b.basename, 'pt'));
    const caixa = el.createDiv({ cls: 'aw-lista' });
    const topo = caixa.createDiv({ cls: 'aw-lista-topo' });
    topo.createSpan({ cls: 'aw-lista-rot', text: (o.titulo || 'Lista automática') + ' · ' + fs.length });
    const filtro = topo.createEl('input', { cls: 'aw-lista-filtro', attr: { type: 'search', placeholder: 'filtrar...' } });
    const tb = caixa.createEl('table');
    const th = tb.createEl('thead').createEl('tr'); cols.forEach(c => th.createEl('th', { text: ROT[c] || c }));
    const corpo = tb.createEl('tbody');
    for (const f of fs) {
      const m = this.fm(f); const inf = this.info[f.path] || {};
      const tr = corpo.createEl('tr'); if (inf.apagado) tr.addClass('aw-apagado');
      for (const c of cols) {
        const td = tr.createEl('td');
        if (c === 'nome') { const a = this.link(td, f, '', ctx.sourcePath, 'aw-lista-nome'); const t = TIPOS[m.tipo]; if (t) setIcon(a.createSpan({ cls: 'aw-li' }), t.icone); a.createSpan({ text: m.titulo || f.basename }); }
        else if (c === 'papel' || c === 'subtipo') td.setText(semLink(m.subtipo || ''));
        else if (c === 'resumo') td.setText(semLink(m.resumo || '').replace(/\*\*/g, ''));
        else if (c === 'status') td.setText(inf.status || '');
        else if (c === 'alterada') td.setText(new Date(f.stat.mtime).toLocaleDateString('pt-BR'));
        else if (c === 'faccao' || c === 'lugar') {
          const nomes = c === 'faccao' ? lista(m.faccao).map(semLink) : lista(m.onde).map(semLink).filter(n => { const g = this.arquivo(n, ''); return g && this.fm(g).tipo === 'lugar'; });
          nomes.forEach((n, i) => { const g = this.arquivo(n, ''); if (i) td.appendText(' · '); if (g) this.link(td, g, n, ctx.sourcePath); else td.appendText(n); });
        } else td.setText(m[c] == null ? '' : semLink(m[c]));
      }
    }
    filtro.addEventListener('input', () => { const q = filtro.value.toLowerCase(); Array.from(corpo.rows).forEach(r => r.toggleClass('aw-oculto', !!q && !r.textContent.toLowerCase().includes(q))); });
  },

  /* ---------- botão "Novo..." ---------- */
  novo(src, el, ctx) {
    const o = yaml(src);
    const caixa = el.createDiv({ cls: 'aw-novos' });
    for (const tipo of lista(o.tipo)) {
      const def = this.cfg.novos[tipo]; if (!def) continue;
      const b = caixa.createEl('button', { cls: 'aw-novo-bt' }); setIcon(b.createSpan(), 'plus'); b.createSpan({ text: def.rotulo || tipo });
      b.addEventListener('click', () => new NovaNota(this.app, this, tipo).open());
    }
  },
  pastasDeLugar() {
    const raiz = this.cfg.pastaLugares; const out = [];
    const anda = (p) => { const d = this.app.vault.getAbstractFileByPath(p); if (!d || !d.children) return; for (const c of d.children) if (c.children) { out.push(c.path); anda(c.path); } };
    anda(raiz); return out.sort((a, b) => a.localeCompare(b, 'pt'));
  },
  proximaSessao() {
    let n = 0; for (const f of this.app.vault.getMarkdownFiles()) { const m = f.basename.match(/^Sess[ãa]o (\d+)/); if (m) n = Math.max(n, Number(m[1])); }
    return String(n + 1).padStart(2, '0');
  },
  async lerModelo(caminho) { const f = this.app.vault.getAbstractFileByPath(caminho); if (!(f instanceof TFile)) throw new Error('modelo não encontrado: ' + caminho); return this.app.vault.read(f); },
  async linhaNoSumario(sumario, linha) {
    const f = this.arquivo(sumario, ''); if (!f) return;
    await this.app.vault.process(f, (txt) => {
      const ls = txt.split('\n'); let fim = -1, achou = false;
      for (let i = 0; i < ls.length; i++) { const tab = /^\s*\|/.test(ls[i]); if (tab) { achou = true; if (/[^|\s]/.test(ls[i])) fim = i; } else if (achou) break; }
      if (fim < 0) return txt.replace(/\s*$/, '\n\n' + linha + '\n');
      ls.splice(fim + 1, 0, linha); return ls.join('\n');
    });
  },
  async criarNota(tipo, v) {
    const def = this.cfg.novos[tipo]; const V = this.app.vault;
    const garante = async (p) => { let ac = ''; for (const parte of p.split('/')) { ac = ac ? ac + '/' + parte : parte; if (!V.getAbstractFileByPath(ac)) await V.createFolder(ac).catch(() => {}); } };
    const troca = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => d[k] == null ? '' : d[k]);
    if (def.sessao) {
      const n = this.proximaSessao(); const d = { n, data: v.data || '' };
      let reg = await this.lerModelo(def.modelo); let prep = await this.lerModelo(def.modeloPrep);
      reg = reg.replace('**Data real:** ', '**Data real:** ' + d.data).replace(/\{n\}/g, n); prep = prep.replace(/\{n\}/g, n);
      if (d.data) reg = reg.replace(/^---\n/, '---\ndata: ' + d.data + '\n');
      const pasta = troca(def.pasta, d), pastaPrep = troca(def.pastaPrep || def.pasta, d);
      await garante(pasta); await garante(pastaPrep);
      const existe = (nome) => this.app.vault.getMarkdownFiles().find(x => x.basename === nome);
      const f = existe('Sessão ' + n) || await V.create(normalizePath(pasta + '/Sessão ' + n + '.md'), reg);
      if (!existe('Preparação ' + n)) await V.create(normalizePath(pastaPrep + '/Preparação ' + n + '.md'), prep);
      await this.linhaNoSumario(def.sumario, troca(def.linha, d));
      new Notice('Sessão ' + n + ' e Preparação ' + n + ' criadas.');
      return f;
    }
    const nome = String(v.nome || '').replace(/[\\/:*?"<>|#^\[\]]/g, '').trim();
    if (!nome) { new Notice('Dê um nome para a nota.'); return null; }
    if (this.arquivo(nome, '')) { new Notice('Já existe uma nota chamada "' + nome + '".'); return this.arquivo(nome, ''); }
    let pasta = v.pasta || '';
    if (def.novaPasta) pasta = pasta ? pasta : this.cfg.pastaLugares + '/' + nome;
    if (!pasta) { new Notice('Escolha o lugar.'); return null; }
    const partes = pasta.split('/'); let lugar = '';
    for (let i = partes.length - 1; i >= 1 && !lugar; i--) { const p = partes[i]; const n2 = Object.prototype.hasOwnProperty.call(this.cfg.pastas, p) ? this.cfg.pastas[p] : p; if (n2 && n2 !== nome) { const g = this.arquivo(n2, ''); if (g && this.fm(g).tipo === 'lugar') lugar = n2; } }
    const d = Object.assign({ nome, lugar, lugarLink: lugar ? '[[' + lugar + ']]' : '' }, v);
    let txt = await this.lerModelo(def.modelo);
    for (const [de, para] of (def.preencher || [])) txt = txt.replace(de, troca(para, d));
    await garante(pasta);
    const f = await V.create(normalizePath(pasta + '/' + nome + '.md'), txt);
    if (def.sumario && def.linha) await this.linhaNoSumario(def.sumario, troca(def.linha, d));
    new Notice('"' + nome + '" criada em ' + pasta + (def.sumario ? ' e acrescentada em ' + def.sumario : '') + '.');
    return f;
  },

  /* ---------- tabela para sortear ---------- */
  sortear(src, el, ctx, filho) {
    const linhas = src.split('\n'); let titulo = 'Sortear'; const itens = [];
    for (const l of linhas) { const m = l.match(/^\s*titulo:\s*(.+)$/i); if (m) { titulo = m[1].trim(); continue; } const i = l.match(/^\s*[-*]\s+(.+)$/); if (i) itens.push(i[1].trim()); }
    const caixa = el.createDiv({ cls: 'aw-sortear' });
    const topo = caixa.createDiv({ cls: 'aw-sortear-topo' });
    const b = topo.createEl('button', { cls: 'aw-novo-bt' }); setIcon(b.createSpan(), 'dices'); b.createSpan({ text: titulo });
    topo.createSpan({ cls: 'aw-sortear-n', text: 'd' + itens.length });
    const res = caixa.createDiv({ cls: 'aw-sortear-res', text: 'Clique para sortear.' });
    let ultimo = -1;
    b.addEventListener('click', async () => {
      if (!itens.length) return; let i = Math.floor(Math.random() * itens.length); if (itens.length > 1 && i === ultimo) i = (i + 1) % itens.length; ultimo = i;
      res.empty(); res.addClass('tem'); res.createSpan({ cls: 'aw-sortear-num', text: String(i + 1) }); const t = res.createDiv(); await this.md(itens[i], t, ctx.sourcePath, filho);
    });
    const det = caixa.createEl('details'); det.createEl('summary', { text: 'Ver as ' + itens.length + ' entradas' });
    const ol = det.createEl('ol'); itens.forEach(it => { const li = ol.createEl('li'); this.md(it, li, ctx.sourcePath, filho); });
  },

  /* ---------- calculadora de viagem ---------- */
  viagem(src, el, ctx) {
    const o = yaml(src); const lugares = lista(o.lugares); const ritmos = lista(o.ritmos);
    const esc_ = Number(o.km_por_px) || 0.15, fator = Number(o.fator) || 1.25;
    const caixa = el.createDiv({ cls: 'aw-viagem' });
    const linha = caixa.createDiv({ cls: 'aw-viagem-linha' });
    const sel = (rot, itens, padrao) => { const w = linha.createEl('label'); w.createSpan({ text: rot }); const s = w.createEl('select', { cls: 'dropdown' }); itens.forEach((n, i) => s.createEl('option', { text: n, attr: { value: String(i) } })); s.value = String(padrao || 0); return s; };
    const de = sel('De', lugares.map(l => l.nome), 0), para = sel('Para', lugares.map(l => l.nome), Math.min(1, lugares.length - 1)), rit = sel('Como', ritmos.map(r => r.nome + ' (' + r.km_dia + ' km/dia)'), 0);
    const res = caixa.createDiv({ cls: 'aw-viagem-res' });
    const hd = Number(o.horas_dia) || 8;
    const hora = (h) => { const m5 = Math.round(h * 60 / 5) * 5; if (m5 < 60) return Math.max(5, m5) + ' min'; const q = Math.round(h * 4) / 4; const hh = Math.floor(q), mm = Math.round((q - hh) * 60); return hh + 'h' + (mm ? String(mm).padStart(2, '0') : ''); };
    const dur = (dias) => { const h = dias * hd; if (h <= hd) return 'cerca de ' + hora(h) + ' (chega no mesmo dia)'; const d = Math.floor(h / hd), r = h - d * hd; return d + (d === 1 ? ' dia' : ' dias') + (r >= 0.25 ? ' e ' + hora(r) : '') + ' de estrada (' + hd + ' h por dia)'; };
    const calc = () => {
      const a = lugares[Number(de.value)], b = lugares[Number(para.value)], r = ritmos[Number(rit.value)];
      res.empty(); if (!a || !b || !r) return;
      if (a === b) { res.setText('Mesmo lugar.'); return; }
      const km = Math.hypot(a.x - b.x, a.y - b.y) * esc_ * fator;
      res.createDiv({ cls: 'aw-viagem-km', text: (km < 10 ? String(Math.round(km * 10) / 10).replace('.', ',') : Math.round(km)) + ' km' });
      res.createDiv({ cls: 'aw-viagem-dias', text: dur(km / r.km_dia) });
      if (r.nota) res.createDiv({ cls: 'aw-viagem-nota', text: r.nota });
    };
    [de, para, rit].forEach(s => s.addEventListener('change', calc)); calc();
  },

  /* ---------- linha do tempo ---------- */
  linhaDoTempo(src, el, ctx, filho) {
    const o = yaml(src); let evs = [];
    if (o.fonte === 'sessoes') {
      for (const f of this.app.vault.getMarkdownFiles()) { const m = this.fm(f); if (m.tipo !== 'diario' || m.indice || !/^Sess/.test(f.basename)) continue; evs.push({ ordem: m.data ? '1' + String(m.data) : '0' + f.basename, quando: m.data ? new Date(String(m.data) + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'sem data', titulo: m.titulo || f.basename, texto: m.resumo || '', arq: f }); }
      evs.sort((a, b) => a.ordem.localeCompare(b.ordem));
    } else {
      evs = lista(o.eventos).map(e => ({ ordem: Number(e.ano), quando: e.quando || (Number(e.ano) < 0 ? Math.abs(e.ano) + ' ' + (o.antes || 'a.R.') : e.ano + ' ' + (o.depois || 'd.R.')), titulo: e.titulo || '', texto: e.texto || '', arq: e.nota ? this.arquivo(e.nota, ctx.sourcePath) : null, destaque: !!e.destaque }));
      evs.sort((a, b) => a.ordem - b.ordem);
    }
    const lt = el.createDiv({ cls: 'aw-lt' });
    if (!evs.length) { lt.createDiv({ cls: 'aw-vazio', text: o.vazio || 'Nada por aqui ainda.' }); return; }
    for (const e of evs) {
      const item = lt.createDiv({ cls: 'aw-lt-item' + (e.destaque ? ' destaque' : '') });
      item.createDiv({ cls: 'aw-lt-quando', text: e.quando });
      const c = item.createDiv({ cls: 'aw-lt-corpo' });
      if (e.arq) this.link(c, e.arq, e.titulo, ctx.sourcePath, 'aw-lt-titulo'); else c.createDiv({ cls: 'aw-lt-titulo', text: e.titulo });
      if (e.texto) { const t = c.createDiv({ cls: 'aw-lt-texto' }); this.md(e.texto, t, ctx.sourcePath, filho); }
    }
  },

  /* ---------- o que mudou desde a sessão ---------- */
  mudancas(src, el, ctx) {
    const o = yaml(src); const eu = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    const d = o.desde || (eu ? this.fm(eu).data : null);
    const caixa = el.createDiv({ cls: 'aw-relacionados aw-mudancas' });
    caixa.createDiv({ cls: 'aw-relacionados-titulo', text: 'Notas alteradas desde a sessão' });
    if (!d) { caixa.createDiv({ cls: 'aw-vazio', text: 'Preencha "data: AAAA-MM-DD" nas propriedades desta nota para a lista aparecer.' }); return; }
    const ini = new Date(String(d) + 'T00:00:00').getTime(); const fim = o.ate ? new Date(String(o.ate) + 'T00:00:00').getTime() : Infinity;
    const fs = this.app.vault.getMarkdownFiles().filter(f => { const m = this.fm(f); return f.path !== ctx.sourcePath && !m.oculto && !m.indice && m.tipo && m.tipo !== 'diario' && m.tipo !== 'regra' && f.stat.mtime >= ini && f.stat.mtime < fim; }).sort((a, b) => b.stat.mtime - a.stat.mtime);
    if (!fs.length) { caixa.createDiv({ cls: 'aw-vazio', text: 'Nenhuma nota de lugar, NPC, facção, monstro ou trama foi alterada desde ' + new Date(ini).toLocaleDateString('pt-BR') + '.' }); return; }
    const chips = caixa.createDiv({ cls: 'aw-chips' });
    for (const f of fs) { const m = this.fm(f); const t = TIPOS[m.tipo]; const a = this.link(chips, f, '', ctx.sourcePath, 'aw-chip'); if (t) setIcon(a.createSpan({ cls: 'aw-chip-icone' }), t.icone); a.createSpan({ text: (m.titulo || f.basename) + ' · ' + new Date(f.stat.mtime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) }); }
  },

  /* ---------- ganchos pendentes (pontas soltas de todas as sessões) ---------- */
  async ganchos(src, el, ctx, filho) {
    const o = yaml(src); const secao = new RegExp(o.secao || 'Pontas soltas', 'i');
    const caixa = createDiv({ cls: 'aw-ganchos' }); let total = 0;
    const fs = this.app.vault.getMarkdownFiles().filter(f => { const m = this.fm(f); return m.tipo === 'diario' && !m.indice && !m.oculto; }).sort((a, b) => a.basename.localeCompare(b.basename, 'pt'));
    for (const f of fs) {
      const cache = this.app.metadataCache.getFileCache(f); if (!cache || !cache.headings || !cache.listItems) continue;
      const hs = cache.headings; const txt = (await this.app.vault.cachedRead(f)).split('\n'); const achados = [];
      for (let i = 0; i < hs.length; i++) {
        if (!secao.test(hs[i].heading)) continue;
        const a = hs[i].position.start.line; let b = txt.length; for (let j = i + 1; j < hs.length; j++) if (hs[j].level <= hs[i].level) { b = hs[j].position.start.line; break; }
        for (const it of cache.listItems) { const ln = it.position.start.line; if (ln <= a || ln >= b) continue; const m = (txt[ln] || '').match(/^\s*[-*]\s+(?:\[( |x|X)\]\s+)?(.*)$/); if (!m || !m[2].trim()) continue; achados.push({ ln, feito: !!m[1] && m[1] !== ' ', tarefa: m[1] !== undefined, texto: m[2].trim() }); }
      }
      const abertos = achados.filter(g => !g.feito); if (!abertos.length) continue;
      const grupo = caixa.createDiv({ cls: 'aw-ganchos-grupo' }); this.link(grupo, f, this.fm(f).titulo || f.basename, ctx.sourcePath, 'aw-ganchos-sessao');
      for (const g of abertos) {
        total++; const li = grupo.createDiv({ cls: 'aw-gancho' }); const cb = li.createEl('input', { attr: { type: 'checkbox' } }); const t = li.createDiv(); this.md(g.texto, t, f.path, filho);
        cb.addEventListener('change', async () => {
          await this.app.vault.process(f, (d) => { const ls = d.split('\n'); const l = ls[g.ln] || ''; if (!l.includes(g.texto)) return d; ls[g.ln] = /\[( |x|X)\]/.test(l) ? l.replace(/\[ \]/, '[x]') : l.replace(/^(\s*[-*]\s+)/, '$1[x] '); return ls.join('\n'); });
          li.addClass('feito'); cb.disabled = true;
        });
      }
    }
    if (!total) caixa.createDiv({ cls: 'aw-vazio', text: 'Nenhuma ponta solta em aberto. Elas vêm da seção "Pontas soltas" de cada sessão.' });
    el.empty(); el.appendChild(caixa);
  },
});

Object.assign(AndaluriaWiki.prototype, {
  /* ---------- painel: tudo o que esta nota cita, agrupado por tipo ---------- */
  painel(src, el, ctx) {
    const o = yaml(src);
    const rl = (this.app.metadataCache.resolvedLinks || {})[ctx.sourcePath] || {};
    const caminhos = new Set(Object.keys(rl));
    for (const n of lista(o.extra)) { const f = this.arquivo(n, ctx.sourcePath); if (f) caminhos.add(f.path); }
    const GRUPOS = [['lugar', 'Lugares'], ['pessoa', 'NPCs'], ['criatura', 'Monstros'], ['trama', 'Tramas e segredos'], ['faccao', 'Facções'], ['cacador', 'Personagens']];
    const por = {}; for (const c of caminhos) { const f = this.app.vault.getAbstractFileByPath(c); if (!(f instanceof TFile) || f.extension !== 'md') continue; const m = this.fm(f); if (m.oculto || m.indice) continue; (por[m.tipo] = por[m.tipo] || []).push(f); }
    const caixa = el.createDiv({ cls: 'aw-painel' }); let n = 0;
    for (const [tipo, rot] of GRUPOS) {
      const fs = (por[tipo] || []).sort((a, b) => a.basename.localeCompare(b.basename, 'pt')); if (!fs.length) continue; n += fs.length;
      const g = caixa.createDiv({ cls: 'aw-painel-grupo' }); const h = g.createDiv({ cls: 'aw-painel-rot' }); setIcon(h.createSpan(), TIPOS[tipo].icone); h.createSpan({ text: rot });
      const chips = g.createDiv({ cls: 'aw-chips' });
      for (const f of fs) { const m = this.fm(f); const a = this.link(chips, f, m.titulo || f.basename, ctx.sourcePath, 'aw-chip'); const inf = this.info[f.path]; if (inf && inf.apagado) a.addClass('aw-apagado'); if (m.subtipo) a.setAttr('aria-label', semLink(m.subtipo)); }
    }
    if (!n) caixa.createDiv({ cls: 'aw-vazio', text: 'O painel se monta sozinho com os lugares, NPCs, monstros e tramas que esta nota citar.' });
  },
});
