# Storybook Setup for MalikAuth

## Installation

Storybook requires additional npm packages. Run the following to install:

```bash
npm install -D @storybook/react @storybook/react-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/blocks storybook
```

## Configuration

Storybook should be configured through `npx storybook@latest init`. This will:
- Detect your framework (React + Vite)
- Create `.storybook/` directory with `main.ts` and `preview.ts`
- Add scripts to `package.json`

## Manual Configuration

If you prefer manual setup, create `.storybook/main.ts`:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

And `.storybook/preview.ts`:

```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

## How to Add Stories

1. Create a file next to your component with `.stories.tsx` extension
2. Example for a Button component:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
};
```

## Running Storybook

```bash
npm run storybook
```

## Notes

- Storybook is not pre-installed to avoid conflicts with parallel agent npm operations
- Run the install command above when ready to set up Storybook
- Full Storybook setup requires `npm run storybook init` for best results
