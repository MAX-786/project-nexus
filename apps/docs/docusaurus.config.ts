import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Project Nexus Docs',
  tagline: 'Your Second Brain. Not Big Tech\'s.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://MAX-786.github.io',
  baseUrl: '/project-nexus/',

  organizationName: 'MAX-786',
  projectName: 'project-nexus',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/MAX-786/project-nexus/edit/main/apps/docs/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Project Nexus',
      logo: {
        alt: 'Project Nexus Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/MAX-786/project-nexus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/getting-started/installation' },
            { label: 'How-To Guides', to: '/how-to/capture-your-first-article' },
            { label: 'Feature Reference', to: '/features/extension/overview' },
          ],
        },
        {
          title: 'Development',
          items: [
            { label: 'Local Setup', to: '/development/local-setup' },
            { label: 'Contributing', to: '/development/contributing' },
            { label: 'Architecture', to: '/development/architecture' },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/MAX-786/project-nexus',
            },
            {
              label: 'Report an Issue',
              href: 'https://github.com/MAX-786/project-nexus/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Project Nexus. Open-source under the MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'sql', 'typescript', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
