export const schema = gql`
  type Bid {
    id: Int!
    amount: Int!
    auction: Auction!
    auctionAddress: String!
  }

  type Query {
    bids: [Bid!]!
  }

  input CreateBidInput {
    amount: Int!
    auctionAddress: String!
  }

  input UpdateBidInput {
    amount: Int
    auctionAddress: String
  }
`
