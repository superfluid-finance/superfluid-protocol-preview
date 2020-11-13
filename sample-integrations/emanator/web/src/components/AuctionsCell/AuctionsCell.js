import { Link, routes } from '@redwoodjs/router'

import Auctions from 'src/components/Auctions'

export const QUERY = gql`
  query AUCTIONS {
    auctions {
      id
      address
      name
      description
      createdAt
      status
      highBid
      generation
      winLength
      owner
      revenue
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => {
  return <div className="rw-text-center">{'No auctions yet. Create one!'}</div>
}

export const Success = ({ auctions }) => {
  return <Auctions auctions={auctions} />
}
