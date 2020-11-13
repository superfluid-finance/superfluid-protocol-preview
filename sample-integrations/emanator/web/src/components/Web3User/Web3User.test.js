import { render } from '@redwoodjs/testing'

import Web3User from './Web3User'

describe('Web3User', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<Web3User />)
    }).not.toThrow()
  })
})
