/*eslint-disable-next-line no-restricted-imports */
// import '../assets/fonts/fonts.css';
import breakpoints from './breakpoints'

const theme = {
  fonts: {
    base: 'Averta, Helvetica Neue, Helvetica, Arial, sans-serif',
    heading: 'Averta, Helvetica Neue, Helvetica, Arial, sans-serif',
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 600,
    semiBold: 500,
    bold: 700,
    Heavy: 900,
  },
  lineHeights: {
    base: 1.5,
    heading: 1.1,
  },
  colors: {
    // Neutral
    bg: '#fff',
    black: '#030314',
    grey: '#3B3E79',
    lightGrey: '#B2B5D9',
    lightestGrey: '#E3E4F1',
    bgGrey: '#F7F7FE',
    transparent: 'transparent',

    // Errors & Success
    red: '#FB1877',
    green: '#0CCB6F',

    // Branding
    highlight: '#1C63F5',
    beige: '#FFF2E3',
    yellow: '#FFE457',

    // Themes
    blue: '#0096FF',
    lightBlue: '#DEF1FF',
    lightestBlue: '#EFF8FF',

    tan: '#D3AD81',

    // Wallets
    coinbaseBlue: '#7D7AFF',
    metamaskOrange: '#F58C25',
  },
  borders: {
    none: 'none',
    thin: '1px solid',
    solid: '2px solid',
  },
  transition: {
    cubic: '1s cubic-bezier(.23,.58,.63,0)',
    ease: '0.2s ease',
  },
  radii: {
    small: '0.5rem',
    base: '1rem',
    medium: '1.5rem',
    strong: '2rem',
    stronger: '3rem',
    heavy: '4rem',
    rounded: '100%',
  },
  space: [
    0,
    '0.125rem', // 2px
    '0.25rem', // 4px
    '0.5rem', // 8px
    '1rem', // 16px
    '2rem', // 32px
    '4rem', // 64px
    '8rem', // 128px
    '16rem', // 256px
    '32rem', // 512px
  ],
  scale: {
    base: '1',
    lg: '1.03',
    sm: '0.98',
  },
  breakpoints: {
    ...breakpoints,
  },
  iconsSizes: {
    small: '2rem', // 32px
    medium: '3rem', // 48px
    large: '5rem', // 80px
  },
}

export default theme
