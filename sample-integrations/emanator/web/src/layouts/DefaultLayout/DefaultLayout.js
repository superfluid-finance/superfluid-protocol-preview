import { Link } from '@redwoodjs/router'

import styled from 'styled-components'

import Header from './Header'

const Background = styled.div`
  width: 100%;
  background-size: cover;
  background-position: 50% 100%;

  @media (max-width: 720px) {
    background-position: 0% 0%;
  }
`

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1280px;
  height: 100%;
  padding: 0 1.5rem;
  @media (min-width: 768px) {
    padding: 0;
  }
`

const Main = styled.main`
  flex: 1;
`

const DefaultLayout = ({ children }) => {
  return (
    <MainWrapper>
      <Background />
      <Header />
      <Main>{children}</Main>
    </MainWrapper>
  )
}

export default DefaultLayout
