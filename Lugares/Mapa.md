---
mapCalc1: 0.01845
map_height_y: 2454
map_width_x: 3173
scale_pixels: 271
scale_pixels_range: 5
tipo: "guia"
titulo: "Mapa de Andaluria"
subtipo: "Mapa interativo"
resumo: "O mapa da região, com um marcador por lugar."
capa: "Anexos/lugares/andaluria.jpg"
secao: "Mapa"
indice: true
---
```ficha
```

```leaflet  
id: AndaluriaMap  
image: [[AndaluriaMapa.png]] ### Link to the map image file. Do not add a ! in front of the image  
bounds: [[0,0], [2454, 3173]] ### Size of the map in px Height_y, Width_x. Ignore 0,0  
height: 600px ### Size of the leaflet embed in px on your screen  
width: 100% ### Size of the leaflet embed in your note  
lat: 1227 ### To center the map, make this half of the map height.  
long: 1586.5 ### To center the map, make this half of the map width.  
minZoom: -2.0 ### Controls how far away from the map you can zoom out. Hover over the target icon to see the current level.  
maxZoom: 1 ### Controls how far towards the map you can zoom in. Hover over the target icon to see the current level.  
defaultZoom: -2 ### Sets the default zoom level when the map loads. Hover over the target icon to see the current level.  
zoomDelta: 0.5 ### Adjust how much the zoom changes when you zoom in or out.  
unit: km ### The value displayed when measuring so you know what type of unit is being measure.  
scale: 0.01845 ### Real units/px (resolution) of your map  
recenter: false  
darkmode: false
marker:
  - default,857,1840,[[Rio Valmorria]],Rio Valmorria
  - default,1534,1110,[[Castillo del Cardenal]],Castillo del Cardenal
  - default,1404,1500,[[Santavio]],Santavio
  - default,1304,1620,[[Vinhedos da Condesa]],Vinhedos da Condesa
  - default,954,2240,[[Basílica do Sol Dourado]],Basílica do Sol Dourado
  - default,1604,1400,[[Acampamentos Caio]],Acampamento Caio
  - default,1614,1680,[[Acampamentos Caio]],Acampamento Caio (lago)
  - default,1914,2640,[[Base da Sombral Spade]],Base da Sombral Spade
  - default,1159,1940,[[Entreposto do Telhado Vermelho]],Entreposto do Telhado Vermelho
  - default,1674,1750,[[Porto Bello]],Porto Bello (sob o lago)
  - default,1444,1930,[[Shii Tak]],Bosque onde Shii Tak acordou
  - default,1404,2395,[[Kremm Yni]],Fazenda de Kremm Yni
  - default,1141,873,[[Blackspor]],Blackspor
  - default,781,700,[[Moonstone]],Moonstone
  - default,1038,460,[[Moonstone]],Fazenda de kiwi
  - default,1584,414,[[Nobreza e Mercadores]],Palácio da família dos transportes
  - default,221,1347,[[Rivercraft]],Rivercraft
  - default,124,2340,[[Highmem]],Highmem
```

## Locais marcados
| Local | Nota |
|---|---|
| Jesaña | [[Jesaña]] |
| Montanhas Serracorte | [[Montanhas Serracorte]] |
| Rio Valmorria | [[Rio Valmorria]] |
| Castillo del Cardenal | [[Castillo del Cardenal]] |
| Santavio | [[Santavio]] |
| Vinhedos da Condesa | [[Vinhedos da Condesa]] |
| Basílica do Sol Dourado | [[Basílica do Sol Dourado]] |
| Acampamentos Caio (dois pontos) | [[Acampamentos Caio]] |
| Base da Sombral Spade | [[Base da Sombral Spade]] |
| Entreposto do Telhado Vermelho | [[Entreposto do Telhado Vermelho]] |
| Porto Bello (sob o lago; segredo) | [[Porto Bello]] |
| Bosque onde Shii Tak acordou | [[Shii Tak]] |
| Fazenda de Kremm Yni | [[Kremm Yni]] |
| Blackspor | [[Blackspor]] |
| Moonstone | [[Moonstone]] |
| Fazenda de kiwi | [[Moonstone]] |
| Palácio da família dos transportes | [[Nobreza e Mercadores]] |
| Rivercraft | [[Rivercraft]] |
| Highmem | [[Highmem]] |

## Locais com nota, ainda sem ponto
[[Plaza del Sol]] (dentro de Jesaña) · [[O Portão do Inferno]] (segredo)

## Como adicionar um ponto
- **Pelo mapa:** clique direito no mapa para criar o marcador; clique direito no marcador para escolher a nota que ele abre.
- **Pela nota:** adicione uma linha à lista `marker:` do bloco acima, no mesmo formato das outras: `  - default,<lat>,<long>,[[Nome da Nota]],Texto ao passar o mouse` (com os dois espaços e o hífen no começo). A latitude conta de baixo para cima (0 a 2454) e a longitude da esquerda para a direita (0 a 3173).

Sumário de todos os lugares: [[Lugares]].
