import Web3User from 'src/components/Web3User'

export const QUERY = gql`
  query Web3UserQuery($address: String!, $auctionAddress: String!) {
    web3User(address: $address, auctionAddress: $auctionAddress) {
      superTokenBalance
      isSubscribed
    }
  }
`

export const beforeQuery = (props) => {
  return { variables: props, pollInterval: 5000 }
}

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Empty</div>

export const Failure = ({ error }) => <div>Error: {error.message}</div>

export const Success = ({ web3User, auctionAddress }) => {
  return <Web3User web3User={web3User} auctionAddress={auctionAddress} />
}
