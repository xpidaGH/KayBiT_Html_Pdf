import { CodeTheme } from '../types';

export interface ThemeOption {
  id: CodeTheme;
  name: string;
  type: 'dark' | 'light';
  background: string;
  textColor: string;
  accentColor: string;
  css: string;
}

export const CODE_THEMES: Record<CodeTheme, ThemeOption> = {
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    background: '#282a36',
    textColor: '#f8f8f2',
    accentColor: '#bd93f9',
    css: `
      .theme-dracula pre[class*="language-"], .theme-dracula code[class*="language-"] { color: #f8f8f2; background: #282a36; }
      .theme-dracula .token.comment, .theme-dracula .token.prolog, .theme-dracula .token.doctype, .theme-dracula .token.cdata { color: #6272a4; font-style: italic; }
      .theme-dracula .token.punctuation { color: #f8f8f2; }
      .theme-dracula .token.property, .theme-dracula .token.tag, .theme-dracula .token.constant, .theme-dracula .token.symbol, .theme-dracula .token.deleted { color: #ff79c6; }
      .theme-dracula .token.boolean, .theme-dracula .token.number { color: #bd93f9; }
      .theme-dracula .token.selector, .theme-dracula .token.attr-name, .theme-dracula .token.string, .theme-dracula .token.char, .theme-dracula .token.builtin, .theme-dracula .token.inserted { color: #f1fa8c; }
      .theme-dracula .token.operator, .theme-dracula .token.entity, .theme-dracula .token.url, .theme-dracula .language-css .token.string, .theme-dracula .style .token.string { color: #ff79c6; }
      .theme-dracula .token.atrule, .theme-dracula .token.attr-value, .theme-dracula .token.keyword { color: #ff79c6; font-weight: 600; }
      .theme-dracula .token.function, .theme-dracula .token.class-name { color: #50fa7b; }
      .theme-dracula .token.regex, .theme-dracula .token.important, .theme-dracula .token.variable { color: #f1fa8c; }
    `
  },
  'one-dark': {
    id: 'one-dark',
    name: 'One Dark Pro',
    type: 'dark',
    background: '#282c34',
    textColor: '#abb2bf',
    accentColor: '#61afef',
    css: `
      .theme-one-dark pre[class*="language-"], .theme-one-dark code[class*="language-"] { color: #abb2bf; background: #282c34; }
      .theme-one-dark .token.comment { color: #5c6370; font-style: italic; }
      .theme-one-dark .token.keyword { color: #c678dd; font-weight: 600; }
      .theme-one-dark .token.string { color: #98c379; }
      .theme-one-dark .token.number, .theme-one-dark .token.boolean { color: #d19a66; }
      .theme-one-dark .token.function { color: #61afef; }
      .theme-one-dark .token.class-name { color: #e5c07b; }
      .theme-one-dark .token.operator { color: #56b6c2; }
      .theme-one-dark .token.property, .theme-one-dark .token.variable { color: #e06c75; }
    `
  },
  'github-light': {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    background: '#f6f8fa',
    textColor: '#24292e',
    accentColor: '#0366d6',
    css: `
      .theme-github-light pre[class*="language-"], .theme-github-light code[class*="language-"] { color: #24292e; background: #f6f8fa; border: 1px solid #e1e4e8; }
      .theme-github-light .token.comment { color: #6a737d; font-style: italic; }
      .theme-github-light .token.keyword { color: #d73a49; font-weight: 600; }
      .theme-github-light .token.string { color: #032f62; }
      .theme-github-light .token.number, .theme-github-light .token.boolean { color: #005cc5; }
      .theme-github-light .token.function { color: #6f42c1; }
      .theme-github-light .token.class-name { color: #6f42c1; }
      .theme-github-light .token.operator { color: #d73a49; }
      .theme-github-light .token.property, .theme-github-light .token.variable { color: #e36209; }
    `
  },
  'nord': {
    id: 'nord',
    name: 'Nord Frost',
    type: 'dark',
    background: '#2e3440',
    textColor: '#d8dee9',
    accentColor: '#88c0d0',
    css: `
      .theme-nord pre[class*="language-"], .theme-nord code[class*="language-"] { color: #d8dee9; background: #2e3440; }
      .theme-nord .token.comment { color: #616e88; font-style: italic; }
      .theme-nord .token.keyword { color: #81a1c1; font-weight: 600; }
      .theme-nord .token.string { color: #a3be8c; }
      .theme-nord .token.number, .theme-nord .token.boolean { color: #b48ead; }
      .theme-nord .token.function { color: #88c0d0; }
      .theme-nord .token.class-name { color: #8fbcbb; }
      .theme-nord .token.operator { color: #81a1c1; }
      .theme-nord .token.variable { color: #d8dee9; }
    `
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai Pro',
    type: 'dark',
    background: '#272822',
    textColor: '#f8f8f2',
    accentColor: '#a6e22e',
    css: `
      .theme-monokai pre[class*="language-"], .theme-monokai code[class*="language-"] { color: #f8f8f2; background: #272822; }
      .theme-monokai .token.comment { color: #75715e; font-style: italic; }
      .theme-monokai .token.keyword { color: #f92672; font-weight: 600; }
      .theme-monokai .token.string { color: #e6db74; }
      .theme-monokai .token.number, .theme-monokai .token.boolean { color: #ae81ff; }
      .theme-monokai .token.function { color: #a6e22e; }
      .theme-monokai .token.class-name { color: #66d9ef; }
      .theme-monokai .token.operator { color: #f92672; }
    `
  },
  'vscode-dark': {
    id: 'vscode-dark',
    name: 'VS Code Dark+',
    type: 'dark',
    background: '#1e1e1e',
    textColor: '#d4d4d4',
    accentColor: '#569cd6',
    css: `
      .theme-vscode-dark pre[class*="language-"], .theme-vscode-dark code[class*="language-"] { color: #d4d4d4; background: #1e1e1e; }
      .theme-vscode-dark .token.comment { color: #6a9955; font-style: italic; }
      .theme-vscode-dark .token.keyword { color: #569cd6; font-weight: 600; }
      .theme-vscode-dark .token.string { color: #ce9178; }
      .theme-vscode-dark .token.number, .theme-vscode-dark .token.boolean { color: #b5cea8; }
      .theme-vscode-dark .token.function { color: #dcdcaa; }
      .theme-vscode-dark .token.class-name { color: #4ec9b0; }
      .theme-vscode-dark .token.operator { color: #d4d4d4; }
    `
  },
  'solarized-light': {
    id: 'solarized-light',
    name: 'Solarized Light',
    type: 'light',
    background: '#fdf6e3',
    textColor: '#657b83',
    accentColor: '#268bd2',
    css: `
      .theme-solarized-light pre[class*="language-"], .theme-solarized-light code[class*="language-"] { color: #657b83; background: #fdf6e3; border: 1px solid #eee8d5; }
      .theme-solarized-light .token.comment { color: #93a1a1; font-style: italic; }
      .theme-solarized-light .token.keyword { color: #859900; font-weight: 600; }
      .theme-solarized-light .token.string { color: #2aa198; }
      .theme-solarized-light .token.number, .theme-solarized-light .token.boolean { color: #d33682; }
      .theme-solarized-light .token.function { color: #268bd2; }
      .theme-solarized-light .token.class-name { color: #b58900; }
      .theme-solarized-light .token.operator { color: #859900; }
    `
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    type: 'dark',
    background: '#011627',
    textColor: '#d6deeb',
    accentColor: '#82aaff',
    css: `
      .theme-night-owl pre[class*="language-"], .theme-night-owl code[class*="language-"] { color: #d6deeb; background: #011627; }
      .theme-night-owl .token.comment { color: #637777; font-style: italic; }
      .theme-night-owl .token.keyword { color: #c792ea; font-weight: 600; }
      .theme-night-owl .token.string { color: #ecc48d; }
      .theme-night-owl .token.number, .theme-night-owl .token.boolean { color: #f78c6c; }
      .theme-night-owl .token.function { color: #82aaff; }
      .theme-night-owl .token.class-name { color: #ffcb8b; }
      .theme-night-owl .token.operator { color: #c792ea; }
    `
  }
};
