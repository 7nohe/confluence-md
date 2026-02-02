import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Confluence MD',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
      },
      social: {
        github: 'https://github.com/daiki/confluence-md',
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: { ja: 'はじめに' },
          autogenerate: { directory: 'getting-started' },
        },
        {
          label: 'Guides',
          translations: { ja: 'ガイド' },
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Reference',
          translations: { ja: 'リファレンス' },
          autogenerate: { directory: 'reference' },
        },
        {
          label: 'Development',
          translations: { ja: '開発' },
          autogenerate: { directory: 'development' },
        },
      ],
    }),
  ],
});
