import React from 'react'
import styled from 'styled-components'

import { themeGet } from '@styled-system/theme-get'
import { navigate, routes } from '@redwoodjs/router'

import { unlockBrowser } from 'src/web3/connect'
import Link from 'src/components/core/Link'

const Container = styled.header`
  position: relative;
  width: 100%;
  padding: ${themeGet('space.4')};
  background-color: ${themeGet('colors.bg')};
  display: flex;
  align-items: center;
`

const RightSection = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
`

const Header = () => {
  const onConnect = () => {
    const { walletAddress } = unlockBrowser({
      debug: true,
    })
  }

  return (
    <Container>
      <Link onClick={() => navigate(routes.home())}>Emanator</Link>
      <RightSection>
        <button className="rw-button" onClick={onConnect}>
          Connect wallet
        </button>
      </RightSection>
    </Container>
  )
}

export default Header
