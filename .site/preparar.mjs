// Copia o vault (a pasta acima desta) para content/, que é de onde o Quartz gera o site.
// Roda antes de "npx quartz build", na Action do GitHub ou no computador.
import fs from "fs"
import path from "path"

const raiz = path.resolve(import.meta.dirname, "..")
const destino = path.resolve(import.meta.dirname, "content")

// o que fica fora do site
const FORA = new Set([".site", ".git", ".github", ".obsidian", ".trash", "Modelos", "atlas-vtt"])
const ARQUIVOS_FORA = new Set([".gitignore", ".gitattributes", "azer.yaml"])
const INICIO = "00 - Início.md"

fs.rmSync(destino, { recursive: true, force: true })
fs.mkdirSync(destino, { recursive: true })

function copiar(rel = "") {
  for (const e of fs.readdirSync(path.join(raiz, rel), { withFileTypes: true })) {
    const r = rel ? rel + "/" + e.name : e.name
    if (e.isDirectory()) {
      if (!rel && FORA.has(e.name)) continue
      if (e.name.startsWith(".")) continue
      fs.mkdirSync(path.join(destino, r), { recursive: true })
      copiar(r)
    } else {
      if (!rel && ARQUIVOS_FORA.has(e.name)) continue
      fs.copyFileSync(path.join(raiz, r), path.join(destino, r))
    }
  }
}
copiar()

// o Quartz precisa de content/index.md: a página inicial do vault vira a página inicial do site
const inicio = path.join(destino, INICIO)
if (fs.existsSync(inicio)) {
  let t = fs.readFileSync(inicio, "utf8")
  const nome = INICIO.replace(/\.md$/, "")
  if (t.startsWith("---")) t = t.replace(/^---\r?\n/, `---\naliases: ["${nome}", "Início"]\n`)
  else t = `---\naliases: ["${nome}", "Início"]\n---\n` + t
  fs.writeFileSync(path.join(destino, "index.md"), t)
  fs.rmSync(inicio)
}
console.log("Vault copiado para", destino)
