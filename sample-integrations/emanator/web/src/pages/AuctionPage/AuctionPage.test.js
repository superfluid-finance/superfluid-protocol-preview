import { render } from '@redwoodjs/testing'

import AuctionPage from './AuctionPage'

describe('AuctionPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<AuctionPage auctionAddress="42" />)
    }).not.toThrow()
  })
})
