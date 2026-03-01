# Neon Hop (mobile webapp)

Jogo mobile em webapp (HTML + CSS + TypeScript), pronto para testar no Replit/Replot sem backend.

## Como testar no Replit (rápido)

1. Importa este repositório no Replit.
2. No Shell, corre:
   - `npm install`
   - `npm run build`
   - `npm run serve`
3. Abre o preview em `http://localhost:8000`.

## Controles

- **Mobile**: swipe esquerda/direita para mudar de faixa, swipe para cima para saltar.
- **Desktop**: setas esquerda/direita para mudar de faixa, seta cima ou espaço para saltar.

## Privacidade (importante)

Para evitar que dados privados apareçam no GitHub:

- Guarda segredos só em `.env` local (já ignorado pelo `.gitignore`).
- Não guardes prompts/notas privadas em ficheiros versionados.
- Usa pastas locais como `private-notes/` ou `prompts/` (também ignoradas).

Exemplo de variável local em `.env`:

```bash
API_KEY=a_tua_chave_aqui
```

## Desenvolvimento

- `npm run build` → compila `src/game.ts` para `dist/game.js`.
- `npm run watch` → recompila automaticamente durante edição.
- `npm run serve` → servidor local estático para teste.
