module.exports = {
  darkMode: 'class', // 启用暗黑模式
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3AB1CE',
        secondary: '#F472B6',
        dark: {
          100: '#1a1a1a',
          200: '#2d2d2d',
        },
        glass: 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      backdropBlur: {
        xs: '0.125rem', // 2px -> 0.125rem
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      // 扩展暗黑模式下的样式
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.secondary'),
              },
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'), // 暗黑模式下字体颜色为浅色
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.secondary'),
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-text-fill-stroke'),
  ],
};
