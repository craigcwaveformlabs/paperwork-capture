import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0E2B45',
        blue: '#1256A0',
        link: '#0F62C8',
        green: '#63CE63',
        greenInk: '#12300F',
        orange: '#D9730D',
        orangeBg: '#FDF3E7',
        tick: '#2E8B45',
        red: '#C7362C',
        line: '#DDE3EA',
        pageBg: '#F4F7FA',
      },
    },
  },
};

export default config;
