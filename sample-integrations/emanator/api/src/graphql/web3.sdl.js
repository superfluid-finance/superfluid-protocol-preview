export const schema = gql`
  type Web3Auction {
    highBidder: String!
    status: String!
    highBid: Int!
    currentGeneration: Int!
    auctionBalance: Int!
    endTime: DateTime!
    lastBidTime: DateTime!
    pastAuctions: JSON!
    revenue: Int!
  }

  type Web3User {
    superTokenBalance: String!
    isSubscribed: Boolean!
  }

  type Query {
    web3Auction(address: String!): Web3Auction!
    web3User(address: String!, auctionAddress: String!): Web3User!
  }
`
