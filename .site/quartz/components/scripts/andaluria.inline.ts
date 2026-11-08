// Andaluria Wiki — interações no navegador: cartões clicáveis, foco de retratos,
// zoom de imagem e o mapa com pinos (arrastar / aproximar).

function irPara(href: string) {
  const url = new URL(href, window.location.toString())
  const spa = (window as any).spaNavigate
  if (spa) spa(url, false)
  else window.location.assign(url)
}

function ouvir<K extends keyof HTMLElementEventMap>(
  alvo: HTMLElement | Document,
  evento: K,
  fn: (ev: HTMLElementEventMap[K]) => void,
  opts?: AddEventListenerOptions,
) {
  alvo.addEventListener(evento, fn as EventListener, opts)
  window.addCleanup(() => alvo.removeEventListener(evento, fn as EventListener, opts))
}

function autofoco(img: HTMLImageElement) {
  const foco = img.dataset.autofoco
  if (!foco) return
  const aplicar = () => {
    if (img.naturalHeight > img.naturalWidth * 1.1) img.style.objectPosition = foco
  }
  if (img.complete) aplicar()
  else img.addEventListener("load", aplicar, { once: true })
}

function semImagem(img: HTMLImageElement) {
  const trocar = () => {
    const caixa = img.closest(".aw-img")
    if (caixa) {
      caixa.classList.add("aw-semimg")
      caixa.innerHTML = `<span class="aw-monograma">${img.dataset.iniciais ?? ""}</span>`
    } else if (img.classList.contains("aw-capa")) {
      img.closest(".aw-topo")?.classList.remove("tem-capa")
      img.nextElementSibling?.remove()
      img.remove()
    }
  }
  if (img.complete && img.naturalWidth === 0) trocar()
  else img.addEventListener("error", trocar, { once: true })
}

function lightbox(src: string, legenda: string) {
  const fundo = document.createElement("div")
  fundo.className = "aw-lightbox"
  const img = document.createElement("img")
  img.src = src
  fundo.appendChild(img)
  if (legenda) {
    const l = document.createElement("div")
    l.className = "aw-lightbox-legenda"
    l.textContent = legenda
    fundo.appendChild(l)
  }
  const fechar = () => {
    fundo.remove()
    document.removeEventListener("keydown", tecla)
  }
  const tecla = (e: KeyboardEvent) => {
    if (e.key === "Escape") fechar()
  }
  fundo.addEventListener("click", fechar)
  document.addEventListener("keydown", tecla)
  document.body.appendChild(fundo)
}

function montarMapa(raiz: HTMLElement) {
  const W = Number(raiz.dataset.largura) || 3173
  const H = Number(raiz.dataset.altura) || 2454
  const janela = raiz.querySelector(".aw-mapa-janela") as HTMLElement
  const palco = raiz.querySelector(".aw-mapa-palco") as HTMLElement
  if (!janela || !palco) return
  let z = 1,
    x = 0,
    y = 0
  const aplicar = () => {
    const jw = janela.clientWidth,
      jh = janela.clientHeight,
      pw = jw * z,
      ph = (pw * H) / W
    x = Math.min(0, Math.max(jw - pw, x))
    y = ph <= jh ? (jh - ph) / 2 : Math.min(0, Math.max(jh - ph, y))
    palco.style.width = pw + "px"
    palco.style.transform = `translate(${x}px,${y}px)`
    raiz.style.setProperty("--aw-z", String(z))
  }
  const zoom = (fator: number, cx?: number, cy?: number) => {
    const jw = janela.clientWidth,
      jh = janela.clientHeight
    cx = cx ?? jw / 2
    cy = cy ?? jh / 2
    const nz = Math.min(5, Math.max(1, z * fator))
    x = cx - (cx - x) * (nz / z)
    y = cy - (cy - y) * (nz / z)
    z = nz
    aplicar()
  }
  raiz.querySelectorAll<HTMLButtonElement>(".aw-mapa-bt").forEach((b) => {
    ouvir(b, "click", () => {
      if (b.dataset.acao === "mais") zoom(1.4)
      else if (b.dataset.acao === "menos") zoom(1 / 1.4)
      else {
        z = 1
        x = 0
        y = 0
        aplicar()
      }
    })
  })
  ouvir(
    janela,
    "wheel",
    (ev) => {
      ev.preventDefault()
      const r = janela.getBoundingClientRect()
      zoom(ev.deltaY < 0 ? 1.2 : 1 / 1.2, ev.clientX - r.left, ev.clientY - r.top)
    },
    { passive: false },
  )

  let arr: { px: number; py: number; x: number; y: number } | null = null
  ouvir(janela, "pointerdown", (ev) => {
    if ((ev.target as HTMLElement).closest(".aw-pino")) return
    arr = { px: ev.clientX, py: ev.clientY, x, y }
    janela.setPointerCapture(ev.pointerId)
    janela.classList.add("arrastando")
  })
  ouvir(janela, "pointermove", (ev) => {
    if (!arr) return
    x = arr.x + ev.clientX - arr.px
    y = arr.y + ev.clientY - arr.py
    aplicar()
  })
  const soltar = () => {
    arr = null
    janela.classList.remove("arrastando")
  }
  ouvir(janela, "pointerup", soltar)
  ouvir(janela, "pointercancel", soltar)

  // destacar pino <-> item da legenda
  const pares = (i: string) => raiz.querySelectorAll<HTMLElement>(`[data-pino="${i}"]`)
  raiz.querySelectorAll<HTMLElement>("[data-pino]").forEach((e) => {
    const i = e.dataset.pino!
    ouvir(e, "mouseenter", () => pares(i).forEach((p) => p.classList.add("destaque")))
    ouvir(e, "mouseleave", () => pares(i).forEach((p) => p.classList.remove("destaque")))
  })

  const ro = new ResizeObserver(() => aplicar())
  ro.observe(janela)
  window.addCleanup(() => ro.disconnect())
  aplicar()
}


// botões para esconder as barras laterais no computador (lembrados entre visitas)
const BARRAS: [string, string, string, string][] = [
  ["esquerda", "aw-sem-esquerda", "barra da esquerda", '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'],
  ["direita", "aw-sem-direita", "barra da direita", '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>'],
]
function barraFechada(k: string): boolean {
  try {
    return localStorage.getItem("aw-barra-" + k) === "fechada"
  } catch {
    return false
  }
}
function aplicarBarras() {
  for (const [k, cls] of BARRAS) document.documentElement.classList.toggle(cls, barraFechada(k))
}
aplicarBarras()
function botoesBarras() {
  if (document.querySelector(".aw-barras")) return
  const caixa = document.createElement("div")
  caixa.className = "aw-barras"
  for (const [k, cls, rotulo, svg] of BARRAS) {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "aw-barra-bt aw-barra-" + k
    b.title = "Mostrar ou esconder a " + rotulo
    b.setAttribute("aria-label", b.title)
    b.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`
    b.addEventListener("click", () => {
      const fechar = !document.documentElement.classList.contains(cls)
      try {
        localStorage.setItem("aw-barra-" + k, fechar ? "fechada" : "aberta")
      } catch {}
      aplicarBarras()
    })
    caixa.append(b)
  }
  document.body.append(caixa)
}

document.addEventListener("nav", () => {
  aplicarBarras()
  botoesBarras()

  const artigo = document.querySelector("article") as HTMLElement | null
  if (!artigo) return

  artigo.querySelectorAll<HTMLImageElement>("img[data-autofoco]").forEach(autofoco)
  artigo.querySelectorAll<HTMLImageElement>(".aw-img img, img.aw-capa").forEach(semImagem)

  // o cartão inteiro é clicável
  artigo.querySelectorAll<HTMLElement>(".aw-card").forEach((card) => {
    const a = card.querySelector<HTMLAnchorElement>("a.aw-card-titulo")
    if (!a) return
    ouvir(card, "click", (ev) => {
      if ((ev.target as HTMLElement).closest("a")) return
      if (ev.ctrlKey || ev.metaKey) window.open(a.href, "_blank")
      else irPara(a.href)
    })
  })

  // zoom de imagem
  ouvir(artigo, "click", (ev) => {
    const t = ev.target
    if (!(t instanceof HTMLImageElement)) return
    if (
      t.closest("a, .aw-card, .aw-mapa, .aw-lightbox, .aw-nozoom") ||
      t.classList.contains("aw-nozoom")
    )
      return
    lightbox(t.src, t.dataset.legenda || t.getAttribute("alt") || "")
  })

  artigo.querySelectorAll<HTMLElement>(".aw-mapa").forEach(montarMapa)

  // tabela automática: filtrar linhas
  artigo.querySelectorAll<HTMLElement>(".aw-lista").forEach((caixa) => {
    const filtro = caixa.querySelector<HTMLInputElement>(".aw-lista-filtro")
    if (!filtro) return
    ouvir(filtro, "input", () => {
      const q = filtro.value.toLowerCase()
      caixa.querySelectorAll<HTMLTableRowElement>("tbody tr").forEach((r) => {
        r.classList.toggle("aw-oculto", !!q && !(r.textContent || "").toLowerCase().includes(q))
      })
    })
  })

  // tabelas de sortear
  artigo.querySelectorAll<HTMLElement>(".aw-sortear").forEach((caixa) => {
    const bt = caixa.querySelector<HTMLButtonElement>(".aw-sortear-bt")
    const res = caixa.querySelector<HTMLElement>(".aw-sortear-res")
    const itens = Array.from(caixa.querySelectorAll<HTMLLIElement>("ol > li"))
    if (!bt || !res || !itens.length) return
    let ultimo = -1
    ouvir(bt, "click", () => {
      let i = Math.floor(Math.random() * itens.length)
      if (itens.length > 1 && i === ultimo) i = (i + 1) % itens.length
      ultimo = i
      res.innerHTML = ""
      res.classList.add("tem")
      const n = document.createElement("span")
      n.className = "aw-sortear-num"
      n.textContent = String(i + 1)
      const t = document.createElement("div")
      t.innerHTML = itens[i].innerHTML
      res.append(n, t)
    })
  })

  // sites que só carregam quando pedidos
  artigo.querySelectorAll<HTMLButtonElement>(".aw-site-abrir").forEach((b) => {
    ouvir(b, "click", () => {
      const f = document.createElement("iframe")
      f.className = "aw-site-quadro"
      f.src = b.dataset.src || ""
      f.style.height = b.dataset.altura || "80vh"
      f.setAttribute("allow", "autoplay; encrypted-media; fullscreen")
      b.replaceWith(f)
    })
  })
})
