/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Brains@Play Doc',
  tagline: 'Neurotechnology with Everyone',
  url: 'https://docs.brainsatplay.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'brainsatplay', // Usually your GitHub org/user name.
  projectName: 'brainsatplay', // Usually your repo name.
  themeConfig: {
    prism: {
      theme: require('prism-react-renderer/themes/vsDark'),
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
      switchConfig: {
        darkIcon: '🌙',
        darkIconStyle: {
          marginLeft: '2px',
        },
        lightIcon: '\u{1F602}',
        lightIconStyle: {
          marginLeft: '1px',
        },
      },
    },
    navbar: {
      // title: 'Brains@Play',
      logo: {
        alt: 'Brains@Play Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'right',
          label: 'Docs',
        },
        {
          type: 'doc',
          docId: 'reference/index',
          position: 'right',
          label: 'Reference',
        },
        {to: '/blog', label: 'Blog', position: 'right'},
        {
          href: 'https://github.com/brainsatplay/brainsatplay',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            // {
            //   label: 'Stack Overflow',
            //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            // },
            {
              label: 'Discord',
              href: 'https://discord.gg/tQ8P79tw8j',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/brainsatplay',
            },
            {
              label: 'Instagram',
              href: 'https://instagram.com/brainsatplay',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/brainsatplay',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Brains@Play`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    [
      'docusaurus-plugin-typedoc',

      // Plugin / TypeDoc options
      {
        entryPoints: [
          '../src/libraries/js/brainsatplay.js',
        ],
        tsconfig: './tsconfig.json',
        out: 'reference',
        toc: ["classes"],
        sidebar: {
          categoryLabel: 'Reference',
          position: 4,
          fullNames: true,
        },
        disableOutputCheck: true,
        readme: 'none'
      },
    ],
  ],
};
