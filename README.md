# Cron Builder

Drop-in React editor for cron expressions. One shadcn CLI command, themed with your tokens, fully typed.

[Live demo](https://angelocala94.github.io/cron-builder/) · [Props reference](https://angelocala94.github.io/cron-builder/#usage) · [Docs for LLMs](https://angelocala94.github.io/cron-builder/llms.txt)

## Install

```bash
pnpm dlx shadcn@latest add https://angelocala94.github.io/cron-builder/r/cron-builder.json
```

## Usage

```tsx
import * as React from "react";
import { Cron } from "@/components/cron-builder";

export function Schedule() {
  const [value, setValue] = React.useState("30 5 * * 1-5");
  return <Cron value={value} setValue={setValue} />;
}
```

Fully controlled — pass a cron string in, receive one back. Every behavior (clock format, mode, locale, per-dropdown overrides, validation) is a prop. See the [full props reference](https://angelocala94.github.io/cron-builder/#usage) on the site.

## Exports

```tsx
import {
  Cron,
  CronBuilder,
  converter,
  DEFAULT_LOCALE_EN,
  type CronBuilderProps,
  type CronProps,
  type CronError,
  type Locale,
} from "@/components/cron-builder";
```

`Cron` / `CronBuilder` is the component. `converter` exposes the cron parser/serializer helpers. `DEFAULT_LOCALE_EN` can be spread to extend the default copy. `CronProps` is kept as a compatibility alias of `CronBuilderProps`.

## Development

This repo ships three things: the installable block, the custom registry manifest, and the landing/docs site.

```bash
pnpm install        # install dependencies
pnpm dev            # run the landing site
pnpm test           # run the test suite
pnpm typecheck      # check types
pnpm build          # build registry payloads + static site
```

```
registry/new-york/components/      installable component entrypoint
registry/new-york/lib/cron-builder/ supporting parser, types, locale
public/r/                          generated registry payloads
site/                              landing + docs
tests/                             behaviour tests
registry.json                      registry manifest
```

## Credits

Heavily inspired by [react-js-cron](https://github.com/xrutayisire/react-js-cron).

Shipped with a little help from my friends [Claude](https://claude.ai) and [Codex](https://openai.com/codex/).

## License

MIT
