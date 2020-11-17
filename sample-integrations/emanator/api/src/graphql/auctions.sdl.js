export const schema = gql`
  type Auction {
    id: Int!
    owner: String!
    address: String!
    name: String!
    winLength: Int!
    description: String
    createdAt: DateTime!
    status: String!
    highBid: Int!
    generation: Int!
    revenue: Int!
    bids: [Bid]!
  }

  type Query {
    auctions: [Auction!]!
    auction(address: String!): Auction
  }

  input CreateAuctionInput {
    address: String!
    name: String!
    owner: String!
    winLength: Int!
    description: String!
    status: String
    highBid: Int
    generation: Int
  }

  type Mutation {
    createAuction(input: CreateAuctionInput!): Auction
  }
`
