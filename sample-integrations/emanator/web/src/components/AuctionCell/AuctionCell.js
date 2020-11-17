import Auction from 'src/components/Auction'

export const QUERY = gql`
  query FIND_AUCTION_BY_ADDRESS($address: String!) {
    auction(address: $address) {
      id
      name
      address
      description
      createdAt
      winLength
      owner
    }
    web3Auction(address: $address) {
      endTime
      lastBidTime
      auctionBalance
      highBid
      highBidder
      status
      currentGeneration
      pastAuctions
      revenue
    }
  }
`

export const beforeQuery = (props) => {
  return { variables: props, pollInterval: 5000 }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Auction not found</div>

export const Success = ({ auction, web3Auction }) => {
  return <Auction auction={{ ...auction, ...web3Auction }} />
}
