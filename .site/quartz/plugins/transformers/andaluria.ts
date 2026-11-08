/* Andaluria Wiki — versão Quartz do plugin "andaluria-wiki" do Obsidian.
   Transforma os blocos ```ficha```, ```cartoes```, ```mapa```, ```relacionados``` e
   ```navegacao``` em HTML no momento da build, lendo o frontmatter de todas as notas.
   Também resolve wikilinks por nome/alias (sem diferenciar maiúsculas) e usa as
   ilustrações guardadas em _midia/gravuras no lugar dos links da internet. */
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import yaml from "js-yaml"
import { visit } from "unist-util-visit"
import isAbsoluteUrl from "is-absolute-url"
import { Root as MdRoot } from "mdast"
import { Root as HtmlRoot, Element, ElementContent } from "hast"
import { QuartzTransformerPlugin } from "../types"
import { FilePath, FullSlug, slugifyFilePath, splitAnchor } from "../../util/path"
import { BuildCtx } from "../../util/ctx"
import { ICONES } from "./andaluria-icones"
// @ts-ignore
import script from "../../components/scripts/andaluria.inline"

const PASTA_CACHE = "Anexos/gravuras"
const TIPOS: Record<string, { rotulo: string; icone: string }> = {
  lugar: { rotulo: "Lugar", icone: "map-pin" },
  pessoa: { rotulo: "Pessoa", icone: "user" },
  faccao: { rotulo: "Facção", icone: "shield" },
  criatura: { rotulo: "Bestiário", icone: "skull" },
  mundo: { rotulo: "O Mundo", icone: "book-open" },
  cacador: { rotulo: "Caçador", icone: "swords" },
  diario: { rotulo: "Diário de Caça", icone: "scroll" },
  item: { rotulo: "Arsenal", icone: "sword" },
  guia: { rotulo: "Guia", icone: "compass" },
  trama: { rotulo: "Trama", icone: "eye" },
  regra: { rotulo: "Regras", icone: "book-open" },
}
const SECOES: [string, string, string][] = [
  ["Início", "house", "00 - Início"],
  ["Mesa", "dices", "Mesa"],
  ["Lugares", "map-pin", "Lugares"],
  ["Mapa", "map", "Mapa"],
  ["NPCs", "users", "NPCs"],
  ["Personagens", "swords", "Personagens"],
  ["Facções", "shield", "Facções"],
  ["Monstros", "skull", "Monstros"],
  ["Tramas", "eye", "Tramas e Segredos"],
  ["Mundo", "book-open", "Mundo"],
  ["Environments", "mountain", "Environments"],
  ["Sessões", "scroll", "Índice de Sessões"],
]
const SECAO_POR_TIPO: Record<string, string> = {
  lugar: "Lugares",
  pessoa: "NPCs",
  faccao: "Facções",
  criatura: "Monstros",
  trama: "Tramas e Segredos",
  mundo: "Mundo",
  item: "Mundo",
  cacador: "Personagens",
  diario: "Índice de Sessões",
  regra: "Regras",
}
/* o vault de mestre não escreve "tipo" nas notas: ele vem das tags e o "onde" vem das
   pastas, como o plugin faz no Obsidian (.obsidian/plugins/andaluria-wiki/data.json) */
const TIPOS_POR_TAG: [string, string][] = [
  ["ficha", "guia"], ["mesa", "guia"], ["regra", "regra"], ["pc", "cacador"],
  ["personagem", "cacador"], ["sumario", "guia"], ["inicio", "guia"], ["indice", "guia"],
  ["ferramenta", "guia"], ["campanha", "guia"], ["npc", "pessoa"], ["monstro", "criatura"],
  ["lugar", "lugar"], ["trama", "trama"], ["segredo", "trama"], ["faccao", "faccao"],
  ["sessao", "diario"], ["preparacao", "diario"], ["item", "item"], ["mundo", "mundo"],
  ["cultura", "mundo"], ["historia", "mundo"], ["religiao", "mundo"], ["povo", "mundo"],
]
const INDICE_POR_TAG = ["sumario", "inicio", "indice", "ferramenta", "campanha", "ficha", "mesa"]
const PASTAS: Record<string, string | null> = {
  Lugares: null,
  "Andaluria (região)": null,
  "Monstros e Caça": null,
  Serracorte: "Montanhas Serracorte",
  Sessões: null,
  Preparação: null,
  Personagens: null,
  Modelos: null,
  Mesa: null,
  Regras: null,
  Adversaries: null,
  Environments: null,
}
function derivar(fm: Record<string, any>, rel: string): Record<string, any> {
  const m = { ...fm }
  const tags = lista(fm.tags).map((t) => String(t).replace(/^#/, ""))
  if (!m.tipo) for (const [tag, tipo] of TIPOS_POR_TAG) if (tags.includes(tag)) { m.tipo = tipo; break }
  if (m.indice == null && tags.some((t) => INDICE_POR_TAG.includes(t))) m.indice = true
  const nome = path.basename(rel, ".md")
  const extra: string[] = []
  for (const p of rel.split("/").slice(0, -1)) {
    const n = Object.prototype.hasOwnProperty.call(PASTAS, p) ? PASTAS[p] : p
    if (n && n !== nome) extra.push(n)
  }
  if (extra.length) m.onde = lista(m.onde).concat(extra)
  return m
}
const RESERVADAS = [
  "tipo",
  "titulo",
  "subtipo",
  "resumo",
  "capa",
  "capa_foco",
  "imagem",
  "imagem_foco",
  "legenda",
  "secao",
  "onde",
  "faccao",
  "grupo",
  "ordem",
  "indice",
  "ficha",
  "link_ficha",
  "aliases",
]
const BLOCOS = ["ficha", "cartoes", "mapa", "relacionados", "navegacao", "painel", "lista", "site",
  "sortear", "linha-do-tempo", "ganchos", "leaflet", "mudancas", "novo", "npc-gerador", "viagem"]

/* ---------- índice do vault ---------- */
type Nota = {
  rel: string
  slug: FullSlug
  nome: string
  fm: Record<string, any>
  links: Set<string>
  texto: string
}
type Vault = {
  notas: Nota[]
  arquivos: Set<string>
  porNome: Map<string, Nota>
  porAlias: Map<string, Nota>
  porRel: Map<string, Nota>
}

function listar(dir: string, base = ""): string[] {
  const out: string[] = []
  for (const e of fs.readdirSync(path.join(dir, base), { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue
    const rel = base ? base + "/" + e.name : e.name
    if (e.isDirectory()) out.push(...listar(dir, rel))
    else out.push(rel)
  }
  return out
}

function semLink(s: unknown): string {
  return String(s ?? "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
}
function lista<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}
function lerYaml(src: string): Record<string, any> {
  try {
    const o = yaml.load(src || "")
    return o && typeof o === "object" ? (o as Record<string, any>) : {}
  } catch {
    return {}
  }
}
function iniciais(nome: string): string {
  const p = String(nome || "?")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(de|da|do|dos|das|e|o|a|os|as|del|em)$/i.test(w))
  return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase()
}
const chave = (s: string) => s.normalize("NFC").trim().toLowerCase()

function montarVault(dir: string): Vault {
  const arquivos = listar(dir)
  const notas: Nota[] = []
  for (const rel of arquivos.filter((f) => f.endsWith(".md"))) {
    const texto = fs.readFileSync(path.join(dir, rel), "utf8")
    let fm: Record<string, any> = {}
    try {
      fm = matter(texto, { engines: { yaml: (s: string) => lerYaml(s) as object } }).data ?? {}
    } catch {}
    const links = new Set<string>()
    // como no Obsidian: links do frontmatter e do texto contam, os de dentro de blocos de código não
    const semCodigo = texto.replace(/^```[\s\S]*?^```/gm, "")
    for (const m of semCodigo.matchAll(/\[\[([^\]|#^]+)/g)) links.add(m[1].trim())
    notas.push({
      rel,
      slug: slugifyFilePath(rel as FilePath),
      nome: path.basename(rel, ".md"),
      fm: derivar(fm, rel),
      links,
      texto,
    })
  }
  const porNome = new Map<string, Nota>()
  const porAlias = new Map<string, Nota>()
  const porRel = new Map<string, Nota>()
  for (const n of notas) {
    if (!porNome.has(chave(n.nome))) porNome.set(chave(n.nome), n)
    porRel.set(chave(n.rel.replace(/\.md$/, "")), n)
    for (const a of lista(n.fm.aliases)) porAlias.set(chave(String(a)), n)
  }
  return { notas, arquivos: new Set(arquivos), porNome, porAlias, porRel }
}

function acharNota(v: Vault, nome: unknown): Nota | undefined {
  if (!nome) return undefined
  const k = chave(semLink(nome).replace(/\.md$/i, ""))
  return (
    v.porRel.get(k) ?? v.porNome.get(k) ?? v.porAlias.get(k) ?? v.porNome.get(k.split("/").pop()!)
  )
}

function nomeCache(url: string): string {
  let h = 5381
  for (let i = 0; i < url.length; i++) h = ((h << 5) + h + url.charCodeAt(i)) >>> 0
  const m = url.split("?")[0].match(/\.(jpe?g|png|gif|webp)$/i)
  return PASTA_CACHE + "/" + h.toString(16) + "." + (m ? m[1].toLowerCase() : "jpg")
}

/** devolve a URL (interna, "/caminho", ou externa) de uma imagem do frontmatter */
function fonte(v: Vault, valor: unknown): { url: string; remota: boolean } | null {
  if (!valor) return null
  const s = semLink(valor).trim()
  if (/^https?:\/\//i.test(s)) {
    const local = nomeCache(s)
    if (v.arquivos.has(local))
      return { url: "/" + slugifyFilePath(local as FilePath), remota: true }
    return { url: s, remota: true }
  }
  if (v.arquivos.has(s)) return { url: "/" + slugifyFilePath(s as FilePath), remota: false }
  const achado = [...v.arquivos].find((f) => f.endsWith("/" + s) || path.basename(f) === s)
  return achado ? { url: "/" + slugifyFilePath(achado as FilePath), remota: false } : null
}

/* ---------- hast ---------- */
type Filho = ElementContent | string | null | undefined | false
function el(tag: string, props: Record<string, any> = {}, filhos: Filho[] = []): Element {
  return {
    type: "element",
    tagName: tag,
    properties: props,
    children: filhos
      .filter((c): c is ElementContent | string => !!c)
      .map((c) => (typeof c === "string" ? { type: "text", value: c } : c)),
  }
}
function icone(nome: string): Element {
  const filhos: Element[] = []
  for (const m of (ICONES[nome] ?? "").matchAll(/<(\w+)([^>]*?)\/>/g)) {
    const props: Record<string, string> = {}
    for (const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) props[a[1]] = a[2]
    filhos.push(el(m[1], props))
  }
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
    },
    filhos,
  )
}
function linkNota(n: Nota, filhos: Filho[], classe: string[] = []): Element {
  return el("a", { href: "/" + n.slug, className: classe }, filhos)
}

/** markdown curto (links, negrito, itálico) como o que aparece em resumos e fichas */
function md(v: Vault, texto: string): ElementContent[] {
  const out: ElementContent[] = []
  const re =
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*(.+?)\*\*|(?<![\w*])[*_](?![\s*_])(.+?)[*_](?![\w*])/g
  let ultimo = 0
  for (const m of texto.matchAll(re)) {
    if (m.index! > ultimo) out.push({ type: "text", value: texto.slice(ultimo, m.index) })
    if (m[1]) {
      const [alvo, ancora] = splitAnchor(m[1].trim())
      const n = acharNota(v, alvo)
      const rotulo = (m[2] ?? m[1]).trim()
      out.push(
        n
          ? el("a", { href: "/" + n.slug + ancora }, [rotulo])
          : el("a", { className: ["internal", "broken"] }, [rotulo]),
      )
    } else if (m[3]) out.push(el("strong", {}, md(v, m[3])))
    else if (m[4]) out.push(el("em", {}, md(v, m[4])))
    ultimo = m.index! + m[0].length
  }
  if (ultimo < texto.length) out.push({ type: "text", value: texto.slice(ultimo) })
  return out
}

function imagem(v: Vault, valor: unknown, nome: string, classe: string, foco?: unknown): Element {
  const s = fonte(v, valor)
  if (!s)
    return el("div", { className: ["aw-img", classe, "aw-semimg"] }, [
      el("span", { className: ["aw-monograma"] }, [iniciais(nome)]),
    ])
  const props: Record<string, any> = {
    src: s.url,
    alt: nome || "",
    loading: "lazy",
    referrerpolicy: "no-referrer",
    dataIniciais: iniciais(nome),
  }
  if (s.remota) props.className = ["aw-gravura"]
  if (foco) props.style = "object-position: " + String(foco)
  else if (classe === "aw-card-img") props.dataAutofoco = "50% 20%"
  return el("div", { className: ["aw-img", classe] }, [el("img", props)])
}

/* ---------- blocos ---------- */
function navegacao(v: Vault, atual: Nota | undefined, ativo?: string): Element {
  const itens = SECOES.map(([rotulo, ic, nota]) => {
    const n = acharNota(v, nota)
    if (!n) return null
    const ehAtivo = (atual && n.rel === atual.rel) || ativo === nota
    return linkNota(
      n,
      [el("span", { className: ["aw-nav-icone"] }, [icone(ic)]), el("span", {}, [rotulo])],
      ["aw-nav-item", ...(ehAtivo ? ["is-ativo"] : [])],
    )
  })
  return el("nav", { className: ["aw-nav"] }, itens)
}

function ficha(v: Vault, atual: Nota | undefined, src: string): Element[] {
  const local = lerYaml(src)
  const m: Record<string, any> = { ...(atual?.fm ?? {}), ...local }
  const titulo = String(m.titulo || atual?.nome || "")
  const tipo = TIPOS[m.tipo]
  const secao: string | undefined = m.secao || SECAO_POR_TIPO[m.tipo]
  const out: Element[] = [navegacao(v, atual, secao)]

  const capa = fonte(v, m.capa)
  const topo: Filho[] = []
  if (capa) {
    const props: Record<string, any> = {
      src: capa.url,
      alt: "",
      referrerpolicy: "no-referrer",
      className: ["aw-capa", "aw-nozoom", ...(capa.remota ? ["aw-gravura"] : [])],
    }
    if (m.capa_foco) props.style = "object-position: " + String(m.capa_foco)
    else props.dataAutofoco = "50% 22%"
    topo.push(el("img", props), el("div", { className: ["aw-capa-sombra"] }))
  }
  const trilha: Filho[] = []
  if (tipo) trilha.push(el("span", { className: ["aw-trilha-icone"] }, [icone(tipo.icone)]))
  const sf = secao ? acharNota(v, secao) : undefined
  if (sf && sf.rel !== atual?.rel) {
    trilha.push(linkNota(sf, [secao!]))
    if (m.subtipo) trilha.push(el("span", {}, [" · " + semLink(m.subtipo)]))
  } else if (m.subtipo) trilha.push(el("span", {}, [semLink(m.subtipo)]))
  else if (tipo) trilha.push(el("span", {}, [tipo.rotulo]))
  const texto: Filho[] = [
    el("div", { className: ["aw-trilha"] }, trilha),
    el("h1", { className: ["aw-titulo"] }, [titulo]),
  ]
  if (m.resumo) texto.push(el("div", { className: ["aw-resumo"] }, md(v, String(m.resumo))))
  topo.push(el("div", { className: ["aw-topo-texto"] }, texto))
  out.push(
    el(
      "header",
      { className: ["aw-topo", ...(capa ? ["tem-capa"] : []), ...(m.indice ? ["aw-indice"] : [])] },
      topo,
    ),
  )

  const campos: [string, any][] =
    m.ficha && typeof m.ficha === "object" ? Object.entries(m.ficha) : []
  for (const [k, val] of Object.entries(local)) if (!RESERVADAS.includes(k)) campos.push([k, val])
  if (m.imagem || campos.length) {
    const caixa: Filho[] = [el("div", { className: ["aw-infobox-titulo"] }, [titulo])]
    if (m.imagem) {
      const fig = imagem(v, m.imagem, titulo, "aw-infobox-img", m.imagem_foco)
      const img = fig.children[0] as Element
      if (img?.tagName === "img" && m.legenda) img.properties!.dataLegenda = semLink(m.legenda)
      caixa.push(fig)
      if (m.legenda) caixa.push(el("div", { className: ["aw-legenda"] }, [semLink(m.legenda)]))
    }
    const linhas = campos
      .filter(([, val]) => val != null && val !== "")
      .map(([k, val]) => {
        const txt = lista(val)
          .map((x: any) => (Array.isArray(x) ? "[[" + x.flat(5).join("") + "]]" : String(x)))
          .join(" · ")
        return el("tr", {}, [el("th", {}, [k]), el("td", {}, md(v, txt))])
      })
    if (linhas.length)
      caixa.push(el("table", { className: ["aw-campos"] }, [el("tbody", {}, linhas)]))
    if (m.link_ficha)
      caixa.push(
        el(
          "a",
          {
            className: ["aw-botao"],
            href: String(m.link_ficha),
            target: "_blank",
            rel: "noopener",
          },
          ["Abrir a ficha de personagem"],
        ),
      )
    out.push(el("aside", { className: ["aw-infobox", ...(m.tipo ? ["aw-" + m.tipo] : [])] }, caixa))
  }
  return out
}

function cartoes(v: Vault, atual: Nota | undefined, src: string): Element[] {
  const o = lerYaml(src)
  let ns: Nota[]
  if (o.lista) {
    ns = lista(o.lista)
      .map((n) => acharNota(v, n))
      .filter((n): n is Nota => !!n)
  } else {
    ns = v.notas.filter((n) => {
      if (n.rel === atual?.rel) return false
      const m = n.fm
      if (m.indice && !o.indices) return false
      if (o.pasta && !n.rel.startsWith(String(o.pasta).replace(/\/?$/, "/"))) return false
      if (o.tipo && !lista(o.tipo).includes(m.tipo)) return false
      if (
        o.subtipo &&
        !lista(o.subtipo).some((s) =>
          String(m.subtipo || "")
            .toLowerCase()
            .includes(String(s).toLowerCase()),
        )
      )
        return false
      for (const k of ["onde", "faccao", "grupo"]) {
        if (!o[k]) continue
        const alvo = semLink(o[k]).toLowerCase()
        if (!lista(m[k]).some((x) => semLink(x).toLowerCase() === alvo)) return false
      }
      return !!(o.pasta || o.tipo || o.onde || o.faccao || o.grupo)
    })
    ns.sort((a, b) => {
      const oa = a.fm.ordem,
        ob = b.fm.ordem
      if (oa != null || ob != null) return (oa ?? 999) - (ob ?? 999)
      return a.nome.localeCompare(b.nome, "pt")
    })
  }
  if (!ns.length) return o.vazio ? [el("div", { className: ["aw-vazio"] }, [String(o.vazio)])] : []
  const estilo = String(o.estilo || "paisagem")
  const cards = ns.map((n) => {
    const m = n.fm
    const nome = String(m.titulo || n.nome)
    const img = estilo === "retrato" ? m.imagem || m.capa : m.capa || m.imagem
    const corpo: Filho[] = []
    if (m.subtipo && estilo !== "compacto")
      corpo.push(el("div", { className: ["aw-card-sub"] }, [semLink(m.subtipo)]))
    corpo.push(linkNota(n, [nome], ["aw-card-titulo"]))
    if (m.resumo && o.resumo !== false)
      corpo.push(
        el("div", { className: ["aw-card-resumo"] }, [semLink(m.resumo).replace(/\*\*/g, "")]),
      )
    return el("div", { className: ["aw-card"] }, [
      estilo !== "lista" &&
        imagem(
          v,
          img,
          nome,
          "aw-card-img",
          estilo === "retrato" ? m.imagem_foco : m.capa ? m.capa_foco : null,
        ),
      el("div", { className: ["aw-card-corpo"] }, corpo),
    ])
  })
  const props: Record<string, any> = { className: ["aw-cartoes", "aw-" + estilo] }
  if (o.colunas) props.style = "--aw-colunas: " + String(o.colunas)
  return [el("div", props, cards)]
}

function relacionados(v: Vault, atual: Nota | undefined, src: string): Element[] {
  if (!atual) return []
  const o = lerYaml(src)
  const ns = v.notas
    .filter(
      (n) =>
        n.rel !== atual.rel &&
        !n.fm.indice &&
        [...n.links].some((l) => acharNota(v, l)?.rel === atual.rel),
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
  if (!ns.length) return []
  const chips = ns.map((n) => {
    const t = TIPOS[n.fm.tipo]
    return linkNota(
      n,
      [
        t && el("span", { className: ["aw-chip-icone"] }, [icone(t.icone)]),
        el("span", {}, [String(n.fm.titulo || n.nome)]),
      ],
      ["aw-chip"],
    )
  })
  return [
    el("div", { className: ["aw-relacionados"] }, [
      el("div", { className: ["aw-relacionados-titulo"] }, [String(o.titulo || "Aparece em")]),
      el("div", { className: ["aw-chips"] }, chips),
    ]),
  ]
}

function mapa(v: Vault, src: string): Element[] {
  const o = lerYaml(src)
  const s = fonte(v, o.imagem)
  if (!s) return [el("p", {}, ["Imagem do mapa não encontrada."])]
  const W = Number(o.largura) || 3173,
    H = Number(o.altura) || 2454
  const pinos: Element[] = [],
    itens: Element[] = []
  lista(o.pinos).forEach((p: any, i: number) => {
    const n = acharNota(v, p.nota)
    const num = String(p.n ?? i + 1)
    const nome = String(p.nome || (n ? n.fm.titulo || n.nome : semLink(p.nota)))
    const conteudo = [
      el("span", { className: ["aw-pino-n"] }, [num]),
      el("span", { className: ["aw-pino-nome"] }, [nome]),
    ]
    const estilo = `left:${(100 * p.x) / W}%;top:${(100 * p.y) / H}%`
    pinos.push(
      n
        ? el(
            "a",
            { href: "/" + n.slug, className: ["aw-pino"], style: estilo, dataPino: String(i) },
            conteudo,
          )
        : el("span", { className: ["aw-pino"], style: estilo, dataPino: String(i) }, conteudo),
    )
    const resumo = p.resumo || (n ? n.fm.resumo : "")
    itens.push(
      el("div", { className: ["aw-mapa-item"], dataPino: String(i) }, [
        el("span", { className: ["aw-pino-n"] }, [num]),
        el("div", {}, [
          n
            ? linkNota(n, [nome], ["aw-mapa-nome"])
            : el("span", { className: ["aw-mapa-nome"] }, [nome]),
          resumo &&
            el("div", { className: ["aw-mapa-resumo"] }, [semLink(resumo).replace(/\*\*/g, "")]),
        ]),
      ]),
    )
  })
  const bt = (ic: string, dica: string, acao: string) =>
    el(
      "button",
      { className: ["aw-mapa-bt"], ariaLabel: dica, title: dica, dataAcao: acao, type: "button" },
      [icone(ic)],
    )
  return [
    el("div", { className: ["aw-mapa"], dataLargura: W, dataAltura: H }, [
      el("div", { className: ["aw-mapa-barra"] }, [
        bt("zoom-in", "Aproximar", "mais"),
        bt("zoom-out", "Afastar", "menos"),
        bt("maximize", "Ver tudo", "tudo"),
        el("span", { className: ["aw-mapa-dica"] }, [
          "Arraste para mover · role para aproximar · clique num ponto para abrir",
        ]),
      ]),
      el("div", { className: ["aw-mapa-janela"], style: `aspect-ratio: ${W} / ${H}` }, [
        el("div", { className: ["aw-mapa-palco"], style: `aspect-ratio: ${W} / ${H}` }, [
          el("img", {
            src: s.url,
            alt: "Mapa de Andaluria",
            draggable: "false",
            className: ["aw-nozoom"],
          }),
          ...pinos,
        ]),
      ]),
      el("div", { className: ["aw-mapa-legenda"] }, itens),
    ]),
  ]
}

/* ---------- blocos que só o vault de mestre tem ---------- */
const GRUPOS_PAINEL: [string, string][] = [
  ["lugar", "Lugares"],
  ["pessoa", "NPCs"],
  ["criatura", "Monstros"],
  ["trama", "Tramas e segredos"],
  ["faccao", "Facções"],
  ["cacador", "Personagens"],
]
const MORTO = /\b(mort[oa]s?|falecid[oa]|destruíd[oa]|extint[oa])\b/i
function statusDe(n: Nota): string {
  const m =
    n.texto.match(/\*\*Status\*\*\s*\|\s*(.*?)\s*\|/) || n.texto.match(/\*\*Status:\*\*\s*([^·\n]*)/)
  return m ? semLink(m[1]).replace(/\*/g, "").trim() : ""
}
function apagado(n: Nota): boolean {
  return MORTO.test(statusDe(n)) || lista(n.fm.tags).map(String).includes("morto")
}
function visivel(n: Nota): boolean {
  return !n.fm.oculto && !n.fm.indice
}

function painel(v: Vault, atual: Nota | undefined, src: string): Element[] {
  const o = lerYaml(src)
  const achadas = new Map<string, Nota>()
  for (const nome of [...(atual?.links ?? []), ...lista(o.extra).map(String)]) {
    const n = acharNota(v, nome)
    if (n && n !== atual && visivel(n)) achadas.set(n.rel, n)
  }
  const grupos: Element[] = []
  for (const [tipo, rotulo] of GRUPOS_PAINEL) {
    const ns = [...achadas.values()]
      .filter((n) => n.fm.tipo === tipo)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
    if (!ns.length) continue
    grupos.push(
      el("div", { className: ["aw-painel-grupo"] }, [
        el("div", { className: ["aw-painel-rot"] }, [icone(TIPOS[tipo].icone), el("span", {}, [rotulo])]),
        el(
          "div",
          { className: ["aw-chips"] },
          ns.map((n) =>
            linkNota(n, [String(n.fm.titulo || n.nome)], ["aw-chip", ...(apagado(n) ? ["aw-apagado"] : [])]),
          ),
        ),
      ]),
    )
  }
  if (!grupos.length)
    return [el("div", { className: ["aw-vazio"] }, ["Esta nota ainda não cita lugares, NPCs, monstros ou tramas."])]
  return [el("div", { className: ["aw-painel"] }, grupos)]
}

function listaAuto(v: Vault, atual: Nota | undefined, src: string): Element[] {
  const o = lerYaml(src)
  const cols: string[] = lista(o.colunas).length ? lista(o.colunas).map(String) : ["nome", "papel", "lugar"]
  const ROT: Record<string, string> = {
    nome: "Nota", papel: "Papel", subtipo: "Tipo", faccao: "Facção", lugar: "Lugar",
    status: "Status", resumo: "Resumo",
  }
  if (!(o.pasta || o.tipo || o.tag)) return []
  const pasta = o.pasta ? String(o.pasta).replace(/\/?$/, "/") : ""
  const ns = v.notas
    .filter((n) => n !== atual && visivel(n))
    .filter((n) => !pasta || n.rel.startsWith(pasta))
    .filter((n) => !o.tipo || lista(o.tipo).includes(n.fm.tipo))
    .filter((n) => !o.tag || lista(n.fm.tags).some((t) => lista(o.tag).map(String).includes(String(t))))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
  const celula = (n: Nota, c: string): Filho[] => {
    const m = n.fm
    if (c === "nome") {
      const t = TIPOS[m.tipo]
      return [linkNota(n, [t ? el("span", { className: ["aw-li"] }, [icone(t.icone)]) : null, String(m.titulo || n.nome)], ["aw-lista-nome"])]
    }
    if (c === "papel" || c === "subtipo") return [semLink(m.subtipo || "")]
    if (c === "resumo") return [semLink(m.resumo || "").replace(/\*\*/g, "")]
    if (c === "status") return [statusDe(n)]
    if (c === "faccao" || c === "lugar") {
      const nomes = (c === "faccao" ? lista(m.faccao) : lista(m.onde)).map((x) => semLink(x))
      const out: Filho[] = []
      for (const nome of nomes) {
        const alvo = acharNota(v, nome)
        if (c === "lugar" && (!alvo || alvo.fm.tipo !== "lugar")) continue
        if (out.length) out.push(" · ")
        out.push(alvo ? linkNota(alvo, [nome]) : nome)
      }
      return out
    }
    return [m[c] == null ? "" : semLink(m[c])]
  }
  return [
    el("div", { className: ["aw-lista"] }, [
      el("div", { className: ["aw-lista-topo"] }, [
        el("span", { className: ["aw-lista-rot"] }, [String(o.titulo || "Lista") + " · " + ns.length]),
        el("input", { className: ["aw-lista-filtro"], type: "search", placeholder: "filtrar..." }),
      ]),
      el("table", {}, [
        el("thead", {}, [el("tr", {}, cols.map((c) => el("th", {}, [ROT[c] || c])))]),
        el(
          "tbody",
          {},
          ns.map((n) =>
            el("tr", { className: apagado(n) ? ["aw-apagado"] : [] }, cols.map((c) => el("td", {}, celula(n, c)))),
          ),
        ),
      ]),
    ]),
  ]
}

function site(src: string): Element[] {
  const o = lerYaml(src)
  const url = String(o.url || "").trim()
  if (!/^https?:\/\//i.test(url)) return []
  const titulo = String(o.titulo || url.replace(/^https?:\/\//, "").replace(/\/$/, ""))
  const altura = String(o.altura || "80vh")
  const barra = el("div", { className: ["aw-site-barra"] }, [
    el("span", { className: ["aw-site-titulo"] }, [titulo]),
    el("a", { className: ["aw-site-bt", "external"], href: url, target: "_blank", rel: "noopener", title: "Abrir em outra aba", ariaLabel: "Abrir em outra aba" }, [icone("external-link")]),
  ])
  const quadro = (carregar: boolean) =>
    el("iframe", {
      className: ["aw-site-quadro"],
      ...(carregar ? { src: url } : { dataSrc: url }),
      loading: "lazy",
      allow: "autoplay; encrypted-media; fullscreen",
      style: `height: ${altura}`,
    })
  if (o.abrir === "clique")
    return [
      el("div", { className: ["aw-site"] }, [
        barra,
        el("button", { className: ["aw-novo-bt", "aw-site-abrir"], type: "button", dataSrc: url, dataAltura: altura }, [
          icone("play"),
          el("span", {}, ["Abrir aqui"]),
        ]),
      ]),
    ]
  return [el("div", { className: ["aw-site"] }, [barra, quadro(true)])]
}

function sortear(v: Vault, src: string): Element[] {
  let titulo = "Sortear"
  const itens: string[] = []
  for (const l of src.split("\n")) {
    const t = l.match(/^\s*titulo:\s*(.+)$/i)
    if (t) { titulo = t[1].trim(); continue }
    const i = l.match(/^\s*[-*]\s+(.+)$/)
    if (i) itens.push(i[1].trim())
  }
  return [
    el("div", { className: ["aw-sortear"] }, [
      el("div", { className: ["aw-sortear-topo"] }, [
        el("button", { className: ["aw-novo-bt", "aw-sortear-bt"], type: "button" }, [icone("dices"), el("span", {}, [titulo])]),
        el("span", { className: ["aw-sortear-n"] }, ["d" + itens.length]),
      ]),
      el("div", { className: ["aw-sortear-res"] }, ["Toque para sortear."]),
      el("details", {}, [
        el("summary", {}, ["Ver as " + itens.length + " entradas"]),
        el("ol", {}, itens.map((it) => el("li", {}, md(v, it)))),
      ]),
    ]),
  ]
}

function linhaDoTempo(v: Vault, src: string): Element[] {
  const o = lerYaml(src)
  type Ev = { ordem: string | number; quando: string; titulo: string; texto: string; nota?: Nota; destaque?: boolean }
  let evs: Ev[] = []
  if (o.fonte === "sessoes") {
    for (const n of v.notas) {
      if (n.fm.tipo !== "diario" || n.fm.indice || !/^Sess/.test(n.nome)) continue
      const d = n.fm.data ? new Date(String(n.fm.data) + "T12:00:00") : null
      evs.push({
        ordem: d ? "1" + String(n.fm.data) : "0" + n.nome,
        quando: d ? d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }) : "sem data",
        titulo: String(n.fm.titulo || n.nome),
        texto: String(n.fm.resumo || ""),
        nota: n,
      })
    }
    evs.sort((a, b) => String(a.ordem).localeCompare(String(b.ordem)))
  } else {
    evs = lista(o.eventos).map((e: any) => ({
      ordem: Number(e.ano),
      quando: e.quando || (Number(e.ano) < 0 ? Math.abs(e.ano) + " " + (o.antes || "a.R.") : e.ano + " " + (o.depois || "d.R.")),
      titulo: String(e.titulo || ""),
      texto: String(e.texto || ""),
      nota: e.nota ? acharNota(v, e.nota) : undefined,
      destaque: !!e.destaque,
    }))
    evs.sort((a, b) => Number(a.ordem) - Number(b.ordem))
  }
  if (!evs.length) return [el("div", { className: ["aw-vazio"] }, [String(o.vazio || "Nada por aqui ainda.")])]
  return [
    el(
      "div",
      { className: ["aw-lt"] },
      evs.map((e) =>
        el("div", { className: ["aw-lt-item", ...(e.destaque ? ["destaque"] : [])] }, [
          el("div", { className: ["aw-lt-quando"] }, [e.quando]),
          el("div", { className: ["aw-lt-corpo"] }, [
            e.nota ? linkNota(e.nota, [e.titulo], ["aw-lt-titulo"]) : el("div", { className: ["aw-lt-titulo"] }, [e.titulo]),
            e.texto ? el("div", { className: ["aw-lt-texto"] }, md(v, e.texto)) : null,
          ]),
        ]),
      ),
    ),
  ]
}

function ganchos(v: Vault, src: string): Element[] {
  const o = lerYaml(src)
  const secao = new RegExp(String(o.secao || "Pontas soltas"), "i")
  const sessoes = v.notas
    .filter((n) => n.fm.tipo === "diario" && visivel(n))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"))
  const grupos: Element[] = []
  for (const n of sessoes) {
    const linhas = n.texto.split("\n")
    const abertos: string[] = []
    let nivel = 0
    for (const l of linhas) {
      const h = l.match(/^(#{1,6})\s+(.*)$/)
      if (h) {
        if (nivel && h[1].length <= nivel) nivel = 0
        if (secao.test(h[2])) nivel = h[1].length
        continue
      }
      if (!nivel) continue
      const it = l.match(/^\s*[-*]\s+(?:\[( |x|X)\]\s+)?(.*)$/)
      if (it && it[2].trim() && !(it[1] && it[1] !== " ")) abertos.push(it[2].trim())
    }
    if (!abertos.length) continue
    grupos.push(
      el("div", { className: ["aw-ganchos-grupo"] }, [
        linkNota(n, [String(n.fm.titulo || n.nome)], ["aw-ganchos-sessao"]),
        ...abertos.map((t) => el("div", { className: ["aw-gancho"] }, [el("input", { type: "checkbox", disabled: true }), el("div", {}, md(v, t))])),
      ]),
    )
  }
  if (!grupos.length)
    return [el("div", { className: ["aw-vazio"] }, ["Nenhuma ponta solta em aberto. Elas vêm da seção \"Pontas soltas\" de cada sessão."])]
  return [el("div", { className: ["aw-ganchos"] }, grupos)]
}

function leaflet(v: Vault, src: string): Element[] {
  const m = src.match(/image:\s*\[\[([^\]]+)\]\]/) || src.match(/image:\s*(\S+)/)
  const s = m ? fonte(v, m[1]) : null
  if (!s) return []
  return [el("div", { className: ["aw-leaflet"] }, [el("img", { src: s.url, alt: "Mapa", loading: "lazy", className: ["aw-zoom"] })])]
}

/* ---------- plugin ---------- */
export const AndaluriaWiki: QuartzTransformerPlugin = () => {
  let vault: Vault | undefined
  let quando = 0
  const obter = (ctx: BuildCtx) => {
    // reconstrói o índice no máximo a cada 2s (no modo --serve as notas mudam)
    if (!vault || Date.now() - quando > 2000) {
      vault = montarVault(ctx.argv.directory)
      quando = Date.now()
    }
    return vault
  }
  return {
    name: "AndaluriaWiki",
    markdownPlugins(ctx) {
      return [
        () => (tree: MdRoot, file) => {
          const v = obter(ctx)
          const rel = String(file.data.relativePath ?? "")
          const atual = v.porRel.get(chave(rel.replace(/\.md$/, "")))
          const fm = (file.data.frontmatter ??= {} as any) as Record<string, any>
          if (atual?.fm.titulo) fm.title = String(atual.fm.titulo)
          if (atual?.fm.resumo && !fm.description)
            fm.description = semLink(atual.fm.resumo).replace(/\*\*/g, "")
          visit(tree, "code", (node, i, pai) => {
            if (!pai || i == null || !node.lang || !BLOCOS.includes(node.lang)) return
            let filhos: Element[] = []
            try {
              if (node.lang === "ficha") filhos = ficha(v, atual, node.value)
              else if (node.lang === "cartoes") filhos = cartoes(v, atual, node.value)
              else if (node.lang === "mapa") filhos = mapa(v, node.value)
              else if (node.lang === "relacionados") filhos = relacionados(v, atual, node.value)
              else if (node.lang === "navegacao") filhos = [navegacao(v, atual)]
              else if (node.lang === "painel") filhos = painel(v, atual, node.value)
              else if (node.lang === "lista") filhos = listaAuto(v, atual, node.value)
              else if (node.lang === "site") filhos = site(node.value)
              else if (node.lang === "sortear") filhos = sortear(v, node.value)
              else if (node.lang === "linha-do-tempo") filhos = linhaDoTempo(v, node.value)
              else if (node.lang === "ganchos") filhos = ganchos(v, node.value)
              else if (node.lang === "leaflet") filhos = leaflet(v, node.value)
              // novo, npc-gerador, viagem e mudancas só funcionam dentro do Obsidian
              else filhos = []
            } catch (e) {
              console.error("Andaluria Wiki", rel, e)
              filhos = [el("p", {}, ["Não foi possível montar este bloco."])]
            }
            pai.children[i] = {
              type: "paragraph",
              children: [],
              data: {
                hName: "div",
                hProperties: { className: ["aw-bloco", "aw-bloco-" + node.lang] },
                hChildren: filhos,
              },
            } as any
          })
        },
      ]
    },
    htmlPlugins(ctx) {
      // [[Nome]], [[alias]] e [[nome em minúsculas]] -> caminho completo da nota
      return [
        () => (tree: HtmlRoot) => {
          const v = obter(ctx)
          visit(tree, "element", (node) => {
            if (node.tagName !== "a" || typeof node.properties?.href !== "string") return
            const href = node.properties.href
            if (isAbsoluteUrl(href) || href.startsWith("#") || href.startsWith("/")) return
            let alvo = href
            try {
              alvo = decodeURI(href)
            } catch {}
            const [semAncora, ancora] = splitAnchor(alvo)
            if (/\.[a-z0-9]{2,5}$/i.test(semAncora) && !semAncora.endsWith(".md")) return
            const n = acharNota(v, semAncora)
            if (n) node.properties.href = "/" + n.slug + ancora
            else if (!semAncora.startsWith(".")) {
              delete node.properties.href
              node.properties.className = [
                ...((node.properties.className as string[]) ?? []),
                "internal",
                "broken",
              ]
            }
          })
        },
      ]
    },
    externalResources() {
      return { js: [{ script, loadTime: "afterDOMReady", contentType: "inline" }] }
    },
  }
}
