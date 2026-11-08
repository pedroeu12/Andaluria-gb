---
tags: [mesa, segredo]
tipo: "guia"
indice: true
subtipo: "Quem é ligado a quem"
secao: "Mesa"
capa: "https://commons.wikimedia.org/wiki/Special:FilePath/%22Dames_de_Grenade_%C3%A9coutant_des_nains_musiciens%22_%2819316418913%29.jpg?width=960"
cssclasses: [aw-larga]
resumo: "A campanha inteira num diagrama, e um por trama: igreja, Santavio e Porto Bello."
---
```ficha
```

> [!danger] Segredo do Mestre
> Estes diagramas mostram tudo, inclusive o que os jogadores não sabem. Linha cheia é coisa pública; linha tracejada é segredo.

## A campanha inteira

```mermaid
graph TD
  Veyra["Arcebispo Veyra"]:::igreja
  Igreja["Igreja da Eminência Dourada"]:::igreja
  Condesa["Condesa Ysabela IV"]:::nobre
  Conselho["Conselho dos Cinco"]:::gov
  Nocta["Andrea Nocta"]:::gov
  NW["Nightwatch"]:::gov
  Julio["Julio Cantafierro"]:::spade
  Spade["Sombral Spade"]:::spade
  Grupo(["Os caçadores"]):::pc
  Caio["Povo Caio"]:::povo
  Arcedrio["Imperador Arcedrio †"]:::morto
  Portal{{"O Portão do Inferno"}}:::segredo
  Demonio{{"O Demônio de Santavio"}}:::segredo
  Bello["Povo de Porto Bello"]:::povo
  Veyra -->|lidera a ala dura| Igreja
  Veyra -.->|roubou o coração de Arcedrio| Condesa
  Veyra -.->|reabriu| Portal
  Veyra -->|culpa pelos monstros| Caio
  Igreja -->|chama de hereges| Spade
  Condesa -->|enche os cofres| Conselho
  Conselho -.->|faz vista grossa| Condesa
  Condesa -.->|guardava os restos| Arcedrio
  Conselho -->|comanda| NW
  Nocta -->|capitã| NW
  NW -->|guarda os barris em Santavio| Condesa
  Julio -->|lidera| Spade
  Spade -->|manda em missão| Grupo
  Caio -.->|poção que segura a maldição| Julio
  Caio -->|descendem dos rebeldes| Conselho
  Arcedrio -.->|abriu, com o sangue roxo| Portal
  Arcedrio -.->|escravizou| Bello
  Bello -.->|presos, ainda alimentam| Portal
  Portal -.->|noites longas, monstros| Demonio
  Demonio -->|caça| Grupo
  classDef igreja fill:#3a2a12,stroke:#c9a24a,color:#f6ebc9
  classDef nobre fill:#3d1219,stroke:#c9a24a,color:#f6ebc9
  classDef gov fill:#1d2530,stroke:#c9a24a,color:#f6ebc9
  classDef spade fill:#16130f,stroke:#f0cd6e,color:#f0cd6e
  classDef pc fill:#c9a24a,stroke:#16130f,color:#16130f
  classDef povo fill:#22301f,stroke:#c9a24a,color:#f6ebc9
  classDef morto fill:#222,stroke:#777,color:#aaa
  classDef segredo fill:#2a0f14,stroke:#8f1f2e,color:#f1c9cf
```

[[Arcebispo Mateo Veyra]] · [[Igreja da Eminência Dourada]] · [[Condesa Ysabela Delamoña IV]] · [[Conselho dos Cinco]] · [[Andrea Nocta]] · [[Nightwatch]] · [[Julio Cantafierro]] · [[Sombral Spade]] · [[Povo Caio]] · [[Imperador Arcedrio]] · [[O Portão do Inferno]] · [[O Demônio de Santavio]] · [[Porto Bello]]

## A intriga da igreja

```mermaid
graph TD
  Veyra["Arcebispo Mateo Veyra"]:::a
  Igreja["Igreja da Eminência Dourada"]:::a
  Fieis["Fiéis assustados"]:::b
  Caio["Povo Caio"]:::b
  Coracao{{"Coração enegrecido de Arcedrio"}}:::s
  Portal{{"O Portão do Inferno"}}:::s
  Fonte{{"A fonte: o povo de Porto Bello"}}:::s
  Condesa["Condesa Ysabela IV"]:::c
  Noites["As noites longas"]:::s
  Veyra -->|ganha força dentro da| Igreja
  Veyra -->|chama para a igreja| Fieis
  Veyra -->|acusa de heresia| Caio
  Veyra -.->|roubou das masmorras dela| Coracao
  Coracao -.->|chave para reabrir| Portal
  Fonte -.->|mantém aberto| Portal
  Veyra -.->|sabe que existe, não sabe o que é| Fonte
  Portal -.->|causa| Noites
  Noites -->|medo que devolve o povo à| Igreja
  Condesa -.->|foi roubada, aliada incômoda?| Veyra
  classDef a fill:#3a2a12,stroke:#c9a24a,color:#f6ebc9
  classDef b fill:#22301f,stroke:#c9a24a,color:#f6ebc9
  classDef c fill:#3d1219,stroke:#c9a24a,color:#f6ebc9
  classDef s fill:#2a0f14,stroke:#8f1f2e,color:#f1c9cf
```

Ver [[A Verdade por Trás das Noites Longas]] e [[O Segredo da Condesa]].

## Santavio

```mermaid
graph TD
  Grupo(["Os caçadores"]):::pc
  Julio["Julio Cantafierro"]:::n
  Salvador["Salvador Fuentes, o taverneiro"]:::n
  Nocta["Andrea Nocta e a Nightwatch"]:::g
  Veyra["Arcebispo Veyra"]:::i
  Moradores["Moradores entrincheirados"]:::n
  Bruxo["O bruxo morto †"]:::m
  Demonio{{"O Demônio de Santavio"}}:::s
  Caes{{"Cães Demoníacos"}}:::s
  Condesa["A Condesa (dona dos barris)"]:::c
  Julio -->|passou a missão no Entreposto| Grupo
  Bruxo -.->|invocou e não segurou| Demonio
  Demonio -.->|matilha| Caes
  Caes -.->|fizeram a matança| Moradores
  Demonio -.->|anda disfarçado entre| Moradores
  Demonio -.->|já conversou com| Grupo
  Salvador -->|quer ajudar, viu a noite toda| Grupo
  Nocta -->|guarda os barris de| Condesa
  Nocta -->|não quer intrometidos| Grupo
  Veyra -->|chama os aterrorizados| Moradores
  Moradores -->|culpam| Condesa
  classDef pc fill:#c9a24a,stroke:#16130f,color:#16130f
  classDef n fill:#16130f,stroke:#c9a24a,color:#f6ebc9
  classDef g fill:#1d2530,stroke:#c9a24a,color:#f6ebc9
  classDef i fill:#3a2a12,stroke:#c9a24a,color:#f6ebc9
  classDef c fill:#3d1219,stroke:#c9a24a,color:#f6ebc9
  classDef m fill:#222,stroke:#777,color:#aaa
  classDef s fill:#2a0f14,stroke:#8f1f2e,color:#f1c9cf
```

Ver [[Incidente Inicial - O Festival de Santavio]], [[O Demônio de Santavio]], [[Cães Demoníacos]], [[Salvador Fuentes]] e [[Santavio]].

## Porto Bello e a família de Shii Tak

```mermaid
graph TD
  Shii(["Shii Tak"]):::pc
  Mai["Mai Tak, a mãe"]:::f
  Enoki["Enoki Tak, o pai"]:::f
  Mattsu["Mattsu Tak, o irmão"]:::f
  Mejj["Shii Mejj, primo e parceiro de palco"]:::f
  Champ["Champ Gnom, chefe da vila"]:::v
  Mell["Mell, a anciã"]:::v
  Kremm["Kremm Yni, o do queijo"]:::v
  Vila["O resto de Porto Bello"]:::v
  Patrono{{"O patrono dos antigos cogumelos"}}:::s
  Arcedrio["Imperador Arcedrio †"]:::m
  Portal{{"O Portão do Inferno"}}:::s
  Mai --- Enoki
  Mai --> Shii
  Enoki --> Shii
  Mai --> Mattsu
  Mejj ---|Manteiga e Shoyu| Shii
  Champ -.->|pacto do sangue roxo| Patrono
  Mell -.->|pacto do sangue roxo| Patrono
  Patrono -.->|pôs para dormir 500 anos, é o prometido| Shii
  Arcedrio -.->|sequestrou e escravizou| Vila
  Vila -.->|presos nos Círculos Inferiores, alimentam| Portal
  Kremm -.->|estava viajando, escapou e se isolou| Vila
  Shii -->|procura, sem saber de nada disto| Vila
  classDef pc fill:#c9a24a,stroke:#16130f,color:#16130f
  classDef f fill:#22301f,stroke:#c9a24a,color:#f6ebc9
  classDef v fill:#16130f,stroke:#c9a24a,color:#f6ebc9
  classDef m fill:#222,stroke:#777,color:#aaa
  classDef s fill:#2a0f14,stroke:#8f1f2e,color:#f1c9cf
```

Ver [[O Pacto de Porto Bello]], [[Porto Bello]], [[Shii Tak]], [[Kremm Yni]], [[Champ Gnom]], [[Mell]], [[Mai Tak]], [[Enoki Tak]], [[Mattsu Tak]] e [[Shii Mejj]].

> [!note] Como atualizar
> Cada diagrama é um bloco de texto `mermaid`. Uma linha `A -->|rótulo| B` desenha uma seta de A para B; com `-.->` ela sai tracejada. Para um laço novo, acrescente uma linha.
