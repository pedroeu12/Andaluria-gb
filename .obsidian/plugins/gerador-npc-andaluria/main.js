/* Gerador de NPC — Andaluria
   Bloco de código:  ```npc-gerador
                     pasta: Lugares
                     sumario: NPCs.md
                     ```
   Nada é salvo na nota do gerador: o NPC só vira nota quando se clica em "Salvar em local". */
const obsidian = require("obsidian");

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const pickN = (a, n) => { const c = [...a], r = []; while (r.length < n && c.length) r.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]); return r; };

const D = {
  nomesM: ["Alvaro","Benicio","Cael","Dario","Emilio","Fausto","Gaspar","Horacio","Ignacio","Joaquim","Lazaro","Leandro","Marcelo","Nicolau","Octavio","Pascual","Quirino","Rafael","Salvador","Tadeo","Ulises","Valerio","Xavier","Zacarias","Anselmo","Baltasar","Cristobal","Domingo","Estevan","Rodrigo"],
  nomesF: ["Adela","Beatriz","Carmela","Dolores","Esperanza","Fabiola","Graciela","Helena","Inés","Jacinta","Leonor","Lucinda","Marisol","Noemi","Olalla","Pilar","Rosaura","Soledad","Teodora","Úrsula","Valentina","Ximena","Yolanda","Zoraida","Amparo","Brígida","Consuelo","Elvira","Florinda","Remedios"],
  nomesN: ["Alix","Ariel","Cruz","Dani","Eli","Guadalupe","Indy","Jael","Lior","Mar","Noa","Paz","René","Sol","Trini","Val"],
  sobrenomes: ["Albarran","Belmonte","Cantavella","Delgadillo","Espinoza","Ferreiro","Galvez","Herrada","Ibarra","Jaramillo","Lozada","Montoro","Navarro","Olivares","Peralta","Quintana","Robledo","Salazar","Tordesilhas","Urquiza","Valverde","Zambrano","Arriaga","Bustamante","Cordero","Duarte","Escalante","Fuentes","Garrido","Llorente","Mendizabal","Ochoa","Pizarro","Rosales","Sandoval","Trujillo","Vidal","Yáñez","das Vinhas","do Cais","de Santavio","da Serra"],
  ancestralidades: [
    ["humano",8],["elfo",3],["fauno",3],["firbolg",3],["anão",2],["halfling",2],["goblin",2],["orc",2],["katari",2],["clank",2],["aetheris",2],["infernis",2],["emberkin",2],["earthkin",1],["tidekin",1],["skykin",1],["gnomo",1],["drakona",1],["faerie",1],["fungril",1],["galapa",1],["gigante",1],["ribbet",1],["simiah",1]
  ],
  comunidades: [["Hearthborne (gente do campo)",4],["Freeborne (filhos da rebelião)",3],["Wanderborne (Caio ou andarilho)",3],["Orderborne (da igreja)",3],["Highborne (elite)",2],["Loreborne (guardiões de segredos)",2],["Seaborne (do porto)",2],["Slyborne (do submundo)",2],["Ridgeborne (das alturas da Serracorte)",2],["Wildborne (das matas)",1],["Underborne (dos subterrâneos)",1],["Reborne (recomeçou a vida)",1],["Warborne (marcado por conflito)",1]],
  pronomes: [["ele/dele",9],["ela/dela",9],["elu/delu",2]],
  // [masculino, feminino]
  ocupacoes: [["vinhateiro","vinhateira"],["lavrador de vinhedo","lavradora de vinhedo"],["tanoeiro","tanoeira"],["taverneiro","taverneira"],["estivador","estivadora"],["pescador","pescadora"],["mercador de vinho","mercadora de vinho"],["pastor da Serracorte","pastora da Serracorte"],["guarda da Nightwatch","guarda da Nightwatch"],["acólito da Eminência Dourada","acólita da Eminência Dourada"],["padre de vila","sacerdotisa de vila"],["drabardi (adivinho Caio)","drabardi (adivinha Caio)"],["curandeiro","curandeira"],["caçador de monstros","caçadora de monstros"],["coveiro","coveira"],["ferreiro","ferreira"],["bardo itinerante","barda itinerante"],["criado de casa nobre","criada de casa nobre"],["escriba dos arquivos","escriba dos arquivos"],["contrabandista","contrabandista"],["barqueiro do Valmorria","barqueira do Valmorria"],["estalajadeiro","estalajadeira"],["boticário","boticária"],["mascareiro (faz máscaras de baile)","mascareira (faz máscaras de baile)"],["cocheiro","cocheira"],["sineiro da igreja","sineira da igreja"],["mendigo do cais","mendiga do cais"],["nobre menor","nobre menor"],["caravaneiro Caio","caravaneira Caio"],["artesão de amuletos","artesã de amuletos"],["espião de um conselheiro","espiã de um conselheiro"],["fiscal do mercado","fiscal do mercado"],["músico de festival","música de festival"],["padeiro","padeira"],["carroceiro","carroceira"],["informante da Sombral Spade","informante da Sombral Spade"]],
  tracos: ["Desconfia de forasteiros até a segunda taça","Ri alto e fácil, mesmo quando não devia","Fala pouco e observa tudo","Generosidade que beira a imprudência","Orgulho ferido que nunca cicatrizou","Curiosidade que não respeita portas fechadas","Paciência de quem já enterrou muita gente","Devoção sincera, sem fanatismo","Fanatismo recém-adquirido","Humor ácido para esconder o medo","Coragem teimosa","Covardia assumida, mas lealdade firme","Ganância mal disfarçada","Ternura com crianças e animais","Mania de ordem e limpeza","Superstição para tudo: sal, cinza, portas","Otimismo cansado","Rancor antigo contra a nobreza","Vaidade com a própria aparência","Franqueza que ofende","Cortesia impecável e fria","Nostalgia constante de um tempo melhor","Fome de fofoca","Calma inquietante diante do perigo","Impulsividade de quem age antes de pensar","Senso de dever acima de tudo"],
  defeitos: ["Bebe demais desde que as noites cresceram","Deve dinheiro a quem não devia","Mente por reflexo","Não consegue guardar segredo","Guarda segredo até de quem precisa saber","Tem pavor do escuro","Julga rápido e perdoa devagar","Promete mais do que pode cumprir","Inveja quem tem mais","Evita qualquer conflito","Procura briga quando está com medo","Não confia em magia de nenhum tipo","Confia demais em amuletos","Não dorme direito há semanas"],
  vozes: ["Voz rouca, de quem grita no cais","Sussurro constante, como se alguém escutasse","Voz grave e lenta, cada palavra pesada","Fala rápida, atropelando as frases","Voz cantada, com sotaque das caravanas Caio","Tom de sermão, mesmo para pedir pão","Voz doce que endurece de repente","Gagueja quando mente","Pigarreia antes de cada frase","Fala alto demais, por ouvir mal","Voz trêmula, mas firme no conteúdo","Tom seco e cortante, sem enfeite","Arrasta os erres como gente da serra","Ri no meio das próprias frases","Fala em provérbios e ditados","Voz baixa e aveludada, de quem negocia","Estala a língua quando discorda","Pausas longas, olhando para o lado","Termina frases como se fossem perguntas","Tom cansado, suspira muito"],
  aparencias: ["Mãos manchadas de roxo pelo mosto","Cicatriz de garra atravessando o antebraço","Cabelo preso com fita vermelha de festival","Olheiras fundas de quem vigia a noite","Roupa boa demais para o ofício","Roupa remendada com capricho","Um olho de cor diferente do outro","Pele queimada de sol da serra","Sempre com cinza nos dedos","Colar de contas de osso sob a gola","Medalha de sol dourado bem à vista","Faltam dois dedos na mão esquerda","Tatuagem de videira subindo pelo pescoço","Anda mancando, com bengala de videira","Dentes muito brancos, sorriso largo","Perfume forte de alecrim e fumaça","Lenço cobrindo o pescoço, mesmo no calor","Unhas sujas de terra escura","Postura rígida de ex-soldado","Olhar que nunca pousa em ninguém"],
  maneirismos: ["Faz o sinal do sol ao ouvir falar de monstros","Bate três vezes na madeira antes de entrar","Joga uma pitada de sal por cima do ombro","Conta moedas de cabeça enquanto conversa","Gira um anel no dedo quando pensa","Nunca dá as costas para uma janela","Cheira o vinho antes de beber, sempre","Morde o lábio antes de dar má notícia","Assobia a mesma canção de festival","Esfrega um amuleto escondido no bolso","Olha para a lua antes de responder","Serve bebida a todos antes de falar de negócios","Anota tudo num caderninho","Toca o ombro das pessoas ao falar","Evita dizer o nome da Condesa","Risca um círculo no chão com o pé ao parar"],
  desejos: ["Achar alguém da família que sumiu nos vinhedos","Juntar dinheiro para sair de Andaluria","Provar que os ritos antigos ainda funcionam","Subir de posição junto a um conselheiro","Proteger a própria vila, custe o que custar","Vingar-se de um nobre","Fazer as pazes com a família","Descobrir por que as noites cresceram","Manter o negócio de pé até o Solstício","Cair nas graças do Arcebispo","Entrar para a Sombral Spade","Ver a Condesa cair","Conseguir um convite para o baile do Castillo","Pagar uma dívida antes que cobrem com juros","Só quer ficar em paz","Reencontrar um amor que partiu com uma caravana","Livrar-se de algo que encontrou e não devia"],
  segredos: ["Viu algo sair de um barril e não contou a ninguém","Vende informação para a Nightwatch","Reza escondido aos espíritos Caio, apesar de frequentar a igreja","Levou uma mordida de alguma coisa e esconde a ferida","Recebe moedas de um criado da Condesa para manter silêncio","Guarda um texto proibido que não sabe ler","Deixou alguém para trás na noite do ataque","Deve a vida a um caçador da Spade","Sabe de uma entrada para as criptas sob Jesaña","Denunciou um vizinho Caio como herege","Tem um parente infernis escondido em casa","Sonha toda noite com uma voz que vem da serra","Rouba vinho dos tonéis da Condesa","Não é quem diz ser: fugiu de outra cidade","Viu o Arcebispo onde ele não deveria estar","Faz amuletos falsos e os vende como verdadeiros","Nenhum que importe — é exatamente o que parece"],
  fes: [["Fiel da Igreja da Eminência Dourada",4],["Segue os costumes Caio",3],["Mistura as duas tradições sem pensar muito",5],["Perdeu a fé desde que as noites cresceram",2],["Conversão recente, pelos sermões de Veyra",2],["Não crê em nada além do que vê",1]],
  atitudes: ["Quer ajudar, e se oferece antes de pedirem","Desconfia, mas dá para convencer","Tem medo e quer distância de problemas","Interesse puro: tudo tem preço","Hostil a forasteiros armados","Admira caçadores de monstros","Indiferença: tem mais o que fazer","Cordial por fora, avaliando por dentro"]
};
const weighted = (a) => { const t = a.reduce((s, x) => s + x[1], 0); let r = Math.random() * t; for (const x of a) { if ((r -= x[1]) < 0) return x[0]; } return a[0][0]; };

function gerarNPC() {
  const pron = weighted(D.pronomes);
  const g = pron.startsWith("ele") ? "m" : pron.startsWith("ela") ? "f" : "n";
  const nome = pick(g === "m" ? D.nomesM : g === "f" ? D.nomesF : D.nomesN) + " " + pick(D.sobrenomes);
  const oc = pick(D.ocupacoes);
  const ocupacao = g === "m" ? oc[0] : g === "f" ? oc[1] : (oc[0] === oc[1] ? oc[0] : oc[0] + " / " + oc[1]);
  return {
    nome, pronomes: pron,
    ancestralidade: weighted(D.ancestralidades),
    comunidade: weighted(D.comunidades),
    idade: pick(["jovem","jovem","adulto","adulto","adulto","meia-idade","meia-idade","idoso"]),
    ocupacao,
    personalidade: pickN(D.tracos, 2),
    defeito: pick(D.defeitos),
    voz: pick(D.vozes),
    aparencia: pickN(D.aparencias, 2),
    maneirismo: pick(D.maneirismos),
    desejo: pick(D.desejos),
    fe: weighted(D.fes),
    atitude: pick(D.atitudes),
    segredo: pick(D.segredos)
  };
}

function notaDoNPC(n, lugar) {
  const onde = lugar ? `[[${lugar}]]` : "";
  return `---
tags: [npc, gerado]
subtipo: ${JSON.stringify(n.ocupacao.charAt(0).toUpperCase() + n.ocupacao.slice(1))}
---
\`\`\`ficha
\`\`\`

| | |
|---|---|
| **Ancestralidade** | ${n.ancestralidade} |
| **Comunidade** | ${n.comunidade} |
| **Pronomes** | ${n.pronomes} |
| **Idade** | ${n.idade} |
| **Papel** | ${n.ocupacao} |
| **Facção** |  |
| **Onde encontrar** | ${onde} |
| **Status** | vivo(a) |

## Quem é
${n.ocupacao.charAt(0).toUpperCase() + n.ocupacao.slice(1)}. ${n.fe}.

## Personalidade
- ${n.personalidade[0]}
- ${n.personalidade[1]}
- **Defeito:** ${n.defeito}

## Aparência e jeito
- ${n.aparencia[0]}
- ${n.aparencia[1]}
- **Maneirismo:** ${n.maneirismo}

## Voz
${n.voz}

## O que quer
${n.desejo}

## Atitude com o grupo
${n.atitude}

> [!danger] Segredo do Mestre
> ${n.segredo}

## Relação com o grupo

## Notas de campanha
*(o que mudou na mesa — edite aqui depois das sessões)*

- 
`;
}

class EscolherLugar extends obsidian.FuzzySuggestModal {
  constructor(app, pastas, base, onChoose) { super(app); this.pastas = pastas; this.base = base; this.onChoose = onChoose; this.setPlaceholder("Em que local salvar este NPC?"); }
  getItems() { return this.pastas; }
  getItemText(f) { const p = f.path.startsWith(this.base + "/") ? f.path.slice(this.base.length + 1) : f.path; return p || f.path; }
  onChooseItem(f) { this.onChoose(f); }
}

class GeradorNPC extends obsidian.Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("npc-gerador", (source, el, ctx) => this.render(source, el, ctx));
  }

  config(source) {
    const c = { pasta: "Lugares", sumario: "NPCs.md" };
    for (const linha of source.split("\n")) {
      const m = linha.match(/^\s*(pasta|sumario)\s*:\s*(.+?)\s*$/);
      if (m) c[m[1]] = obsidian.normalizePath(m[2]);
    }
    return c;
  }

  render(source, el) {
    const cfg = this.config(source);
    const raiz = el.createDiv({ cls: "npcg" });
    const botoes = raiz.createDiv({ cls: "npcg-botoes" });
    const bGerar = botoes.createEl("button", { text: "🎲 Gerar NPC", cls: "mod-cta" });
    const card = raiz.createDiv({ cls: "npcg-card" });
    const rodape = raiz.createDiv({ cls: "npcg-botoes" });
    const bSalvar = rodape.createEl("button", { text: "💾 Salvar em local" });
    const status = rodape.createSpan({ cls: "npcg-status" });
    let npc = null;

    const linha = (pai, rotulo, valor) => { const d = pai.createDiv({ cls: "npcg-linha" }); d.createSpan({ cls: "npcg-rotulo", text: rotulo }); d.createSpan({ text: valor }); };
    const desenhar = () => {
      card.empty();
      card.createEl("div", { cls: "npcg-nome", text: npc.nome });
      card.createEl("div", { cls: "npcg-sub", text: `${npc.ancestralidade} · ${npc.pronomes} · ${npc.idade} · ${npc.ocupacao}` });
      linha(card, "Comunidade", npc.comunidade);
      linha(card, "Personalidade", npc.personalidade.join(" · "));
      linha(card, "Defeito", npc.defeito);
      linha(card, "Voz", npc.voz);
      linha(card, "Aparência", npc.aparencia.join(" · "));
      linha(card, "Maneirismo", npc.maneirismo);
      linha(card, "Quer", npc.desejo);
      linha(card, "Fé", npc.fe);
      linha(card, "Atitude", npc.atitude);
      const s = card.createDiv({ cls: "npcg-linha npcg-segredo" }); s.createSpan({ cls: "npcg-rotulo", text: "Segredo" }); s.createSpan({ text: npc.segredo });
    };
    const novo = () => { npc = gerarNPC(); desenhar(); bSalvar.disabled = false; status.empty(); };

    bGerar.onclick = novo;
    bSalvar.onclick = () => {
      if (!npc) return;
      const base = this.app.vault.getAbstractFileByPath(cfg.pasta);
      if (!(base instanceof obsidian.TFolder)) { new obsidian.Notice(`Pasta não encontrada: ${cfg.pasta}`); return; }
      const pastas = [];
      const andar = (f) => { for (const c of f.children) if (c instanceof obsidian.TFolder) { pastas.push(c); andar(c); } };
      andar(base);
      if (!pastas.length) pastas.push(base);
      pastas.sort((a, b) => a.path.localeCompare(b.path));
      const atual = npc;
      new EscolherLugar(this.app, pastas, cfg.pasta, async (pasta) => {
        try {
          const arquivo = await this.salvar(atual, pasta, cfg);
          if (npc === atual) { bSalvar.disabled = true; status.empty(); status.appendText("Salvo em "); const a = status.createEl("a", { text: arquivo.path, cls: "internal-link" }); a.onclick = (e) => { e.preventDefault(); this.app.workspace.openLinkText(arquivo.path, "", true); }; }
          new obsidian.Notice(`${atual.nome} salvo em ${pasta.name}`);
        } catch (e) { console.error(e); new obsidian.Notice("Não foi possível salvar: " + e.message); }
      }).open();
    };
    novo();
  }

  async salvar(n, pasta, cfg) {
    const limpo = n.nome.replace(/[\\/:*?"<>|#^\[\]]/g, "").trim();
    let caminho = obsidian.normalizePath(`${pasta.path}/${limpo}.md`), i = 2, titulo = limpo;
    // nome único no vault inteiro, para os links [[Nome]] não ficarem ambíguos
    const existe = (nome) => this.app.vault.getMarkdownFiles().some((f) => f.basename === nome);
    while (existe(titulo)) { titulo = `${limpo} ${i++}`; caminho = obsidian.normalizePath(`${pasta.path}/${titulo}.md`); }
    // o lugar é a nota com o mesmo nome da pasta, se existir; senão sobe até achar uma
    let lugar = "", p = pasta;
    while (p && p.path.length >= cfg.pasta.length) {
      if (this.app.vault.getAbstractFileByPath(`${p.path}/${p.name}.md`)) { lugar = p.name; break; }
      p = p.parent;
    }
    const arquivo = await this.app.vault.create(caminho, notaDoNPC({ ...n, nome: titulo }, lugar));
    await this.atualizarSumario(cfg.sumario, titulo, n, lugar || pasta.name);
    return arquivo;
  }

  async atualizarSumario(caminho, titulo, n, lugar) {
    const f = this.app.vault.getAbstractFileByPath(caminho);
    if (!(f instanceof obsidian.TFile)) return;
    const temNota = this.app.vault.getMarkdownFiles().some((x) => x.basename === lugar);
    const nova = `| [[${titulo}]] | ${n.ocupacao} |  | ${temNota ? `[[${lugar}]]` : lugar} |`;
    await this.app.vault.process(f, (texto) => {
      const linhas = texto.split("\n");
      const vazia = linhas.findIndex((l) => /^\|(\s*\|){4}\s*$/.test(l));
      if (vazia >= 0) { linhas.splice(vazia, 0, nova); return linhas.join("\n"); }
      let ultima = -1; linhas.forEach((l, i) => { if (l.trim().startsWith("|")) ultima = i; });
      if (ultima >= 0) { linhas.splice(ultima + 1, 0, nova); return linhas.join("\n"); }
      return texto.replace(/\s*$/, "\n\n" + nova + "\n");
    });
  }
}

module.exports = GeradorNPC;
