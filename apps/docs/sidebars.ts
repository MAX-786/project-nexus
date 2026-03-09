import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: '🚀 Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/byok-setup',
        'getting-started/first-capture',
      ],
    },
    {
      type: 'category',
      label: '📖 How-To Guides',
      items: [
        'how-to/capture-your-first-article',
        'how-to/build-your-knowledge-graph',
        'how-to/use-spaced-repetition',
        'how-to/use-memory-agent',
        'how-to/manage-collections',
        'how-to/search-your-knowledge',
      ],
    },
    {
      type: 'category',
      label: '🧩 Feature Reference',
      items: [
        {
          type: 'category',
          label: 'Browser Extension',
          items: [
            'features/extension/overview',
            'features/extension/capturing',
            'features/extension/settings',
          ],
        },
        {
          type: 'category',
          label: 'Web Dashboard',
          items: [
            'features/dashboard/feed',
            'features/dashboard/knowledge-graph',
            'features/dashboard/review',
            'features/dashboard/memory',
            'features/dashboard/collections',
            'features/dashboard/settings',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '🚢 Deployment',
      items: [
        'deployment/vercel',
        'deployment/supabase-cloud',
        'deployment/self-hosted',
      ],
    },
    {
      type: 'category',
      label: '🔧 Development',
      items: [
        'development/local-setup',
        'development/local-supabase',
        'development/architecture',
        'development/contributing',
      ],
    },
    {
      type: 'category',
      label: '📚 Reference',
      items: [
        'reference/environment-variables',
        'reference/database-schema',
        'reference/byok-model',
      ],
    },
  ],
};

export default sidebars;
