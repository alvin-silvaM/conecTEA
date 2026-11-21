# Design — "Tecelagem institucional"

Identidade visual do conecTEA. O fio (conexão) é o tema; o marinho dá confiança; o linho dá acolhimento.

## Cores
| Papel | Token | Valor |
|---|---|---|
| Marinho (menu, ações, texto de destaque) | `--navy-900` / `--navy-700` | `#0e1f44` / `#1d3f7a` |
| Fundo (linho) / superfície | `--ground` / `--surface` | `#f8f5ee` / `#ffffff` |
| Texto / texto secundário | `--ink` / `--muted` | `#16213a` / `#566079` (≥ 5,7:1 sobre o fundo) |
| Fios (só identificação e assinatura) | `--coral` `--saffron` `--sky` `--sage` | `#e4572e` `#f2b01e` `#5da9e9` `#6baa75` |
| Estados | `--ok-ink` `--warn-ink` `--danger` | `#245c32` `#6b4500` `#b3261e` |

Cor nunca é o único sinal: status têm ícone e texto; categorias do comunicador têm nome e símbolo.

## Tipografia
Fraunces (títulos e números), Public Sans (interface), Nunito (tela da criança). Arquivos `woff2` em `public/fonts/`, sem CDN.

## Assinatura
O **fio**: faixa trançada coral/açafrão/céu (`.fio`, `--fio`) sob os títulos, na borda da barra do cuidador e na base do balão de fala da criança. A marca são dois anéis entrelaçados.

## Por perfil
- **Escola:** menu lateral marinho, tabelas densas, faixa de indicadores e lista de pendências.
- **Cuidador:** barra superior, saudação e cartões grandes por aluno (avatar colorido, "Abrir comunicador" em destaque).
- **Criança:** fundo creme, botões de 11 rem com símbolo + texto, cor por categoria, balão com o que foi escolhido.

## Regras
Botões e campos ≥ 44 px (criança ≥ 96 px); raio 8 px (12 px em painéis, 32 px na criança); sem tema escuro; sem animação além de retorno ao toque; respeita `prefers-reduced-motion`.
