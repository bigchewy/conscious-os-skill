# Conscious OS launcher skill

Run Conscious OS coaching exercises — in your own coach's voice, with your
profile and history — from any AI tool you already use. This repo holds one
skill and two plugin manifests. The exercises themselves live behind
`https://theconsciousos.com/api/mcp`, a server this repo doesn't otherwise
touch.

## Claude Code, Cowork

One install adds the skill and connects the server. You'll still see an
approval screen the first time you run an exercise — that's expected.

```
/plugin marketplace add bigchewy/conscious-os-skill
/plugin install conscious-os@conscious-os-skill
```

## Cursor

Install the skill:

```
npx skills add bigchewy/conscious-os-skill
```

Then connect the server by hand — add this to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "conscious-os": {
      "type": "http",
      "url": "https://theconsciousos.com/api/mcp"
    }
  }
}
```

(This repo also ships an Agent Plugins 1.0 manifest, which some hosts read
to connect the server automatically. Whether Cursor is one of them hasn't
been confirmed yet — try the skill-only install above first, and only add
the manual step if exercises don't show up.)

## Codex

Install the skill:

```
npx skills add bigchewy/conscious-os-skill
```

Then connect the server once:

```
codex mcp add --transport http conscious-os https://theconsciousos.com/api/mcp
```

## Claude.ai, ChatGPT (web)

No plugin path exists for a browser today. Add `https://theconsciousos.com/api/mcp`
as a custom connector directly from Settings, sign in, and approve.

## License

MIT. See `LICENSE`.
