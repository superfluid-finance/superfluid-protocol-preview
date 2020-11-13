import React from 'react'
import { ThemeProvider } from 'styled-components'
import GlobalStyle from './GlobalStyle'

import theme from './theme'

const Theme = ({ children }) => (
  <ThemeProvider theme={theme}>
    <GlobalStyle />
    {children}
  </ThemeProvider>
)

export default Theme
