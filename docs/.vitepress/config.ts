import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/canvas-editor-docs/',
  title: 'canvas-editor',
  description: 'rich text editor by canvas/svg',
  themeConfig: {
    i18nRouting: false,
    algolia: {
      appId: 'RWSVW6F3S5',
      apiKey: 'e462fffb4d2e9ab4a78c29e0b457ab33',
      indexName: 'hufe'
    },
    logo: '/favicon.png',
    nav: [
      {
        text: '가이드',
        link: '/guide/start',
        activeMatch: '/guide/'
      },
      {
        text: 'Demo',
        link: 'https://hufe.club/canvas-editor'
      },
      {
        text: '공식 플러그인',
        link: '/guide/plugin-internal.html'
      },
      {
        text: '후원',
        link: 'https://hufe.club/donate.jpg'
      }
    ],
    sidebar: [
      {
        text: '시작',
        items: [
          { text: '시작하기', link: '/guide/start' },
          { text: '설정', link: '/guide/option' },
          { text: '국제화', link: '/guide/i18n' },
          { text: '데이터 구조', link: '/guide/schema' }
        ]
      },
      {
        text: '명령',
        items: [
          { text: '실행 액션 명령', link: '/guide/command-execute' },
          { text: '데이터 조회 명령', link: '/guide/command-get' }
        ]
      },
      {
        text: '리스너',
        items: [
          { text: '이벤트 리스너(listener)', link: '/guide/listener' },
          { text: '이벤트 리스너(eventBus)', link: '/guide/eventbus' }
        ]
      },
      {
        text: '단축키',
        items: [
          { text: '내장 단축키', link: '/guide/shortcut-internal' },
          { text: '사용자 정의 단축키', link: '/guide/shortcut-custom' }
        ]
      },
      {
        text: '우클릭 메뉴',
        items: [
          { text: '내장 우클릭 메뉴', link: '/guide/contextmenu-internal' },
          { text: '사용자 정의 우클릭 메뉴', link: '/guide/contextmenu-custom' }
        ]
      },
      {
        text: '오버라이드 메소드',
        items: [{ text: '오버라이드 메소드', link: '/guide/override' }]
      },
      {
        text: 'API',
        items: [
          { text: '인스턴스 API', link: '/guide/api-instance' },
          { text: '공통 API', link: '/guide/api-common' }
        ]
      },
      {
        text: '플러그인',
        items: [
          { text: '사용자 정의 플러그인', link: '/guide/plugin-custom' },
          { text: '공식 플러그인', link: '/guide/plugin-internal' }
        ]
      }
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/Hufe921/canvas-editor'
      }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2021-present Hufe'
    }
  },
  locales: {
    root: {
      label: '한국어',
      lang: 'ko-KR'
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          {
            text: 'Guide',
            link: '/en/guide/start',
            activeMatch: '/en/guide/'
          },
          {
            text: 'Demo',
            link: 'https://hufe.club/canvas-editor'
          },
          {
            text: 'Official plugin',
            link: '/en/guide/plugin-internal.html'
          },
          {
            text: 'Donate',
            link: 'https://hufe.club/donate.jpg'
          }
        ],
        sidebar: [
          {
            text: 'Start',
            items: [
              { text: 'start', link: '/en/guide/start' },
              { text: 'option', link: '/en/guide/option' },
              { text: 'i18n', link: '/en/guide/i18n' },
              { text: 'schema', link: '/en/guide/schema' }
            ]
          },
          {
            text: 'Command',
            items: [
              { text: 'execute', link: '/en/guide/command-execute' },
              { text: 'get', link: '/en/guide/command-get' }
            ]
          },
          {
            text: 'Listener',
            items: [
              { text: 'listener', link: '/en/guide/listener' },
              { text: 'eventbus', link: '/en/guide/eventbus' }
            ]
          },
          {
            text: 'Shortcut',
            items: [
              { text: 'internal', link: '/en/guide/shortcut-internal' },
              { text: 'custom', link: '/en/guide/shortcut-custom' }
            ]
          },
          {
            text: 'Contextmenu',
            items: [
              { text: 'internal', link: '/en/guide/contextmenu-internal' },
              { text: 'custom', link: '/en/guide/contextmenu-custom' }
            ]
          },
          {
            text: 'Override',
            items: [{ text: 'override', link: '/en/guide/override' }]
          },
          {
            text: 'Api',
            items: [
              { text: 'instance', link: '/en/guide/api-instance' },
              { text: 'common', link: '/en/guide/api-common' }
            ]
          },
          {
            text: 'Plugin',
            items: [
              { text: 'custom', link: '/en/guide/plugin-custom' },
              { text: 'official', link: '/en/guide/plugin-internal' }
            ]
          }
        ]
      }
    }
  }
})
