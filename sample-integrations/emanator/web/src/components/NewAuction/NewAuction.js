import { useMutation, useFlash } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import AuctionForm from 'src/components/AuctionForm'

import { deployAuction } from 'src/web3/deploy'

import { QUERY } from 'src/components/AuctionsCell'

const CREATE_AUCTION_MUTATION = gql`
  mutation CreateAuctionMutation($input: CreateAuctionInput!) {
    createAuction(input: $input) {
      id
    }
  }
`

const NewAuction = () => {
  const { addMessage } = useFlash()

  const [createAuction, { loading, error }] = useMutation(
    CREATE_AUCTION_MUTATION,
    {
      onCompleted: () => {
        navigate('/')
        addMessage('Auction created.', { classes: 'rw-flash-success' })
      },
      // This refetches the query on the list page. Read more about other ways to
      // update the cache over here:
      // https://www.apollographql.com/docs/react/data/mutations/#making-all-other-cache-updates
      refetchQueries: [{ query: QUERY }],
      awaitRefetchQueries: true,
    }
  )

  const onSave = async (input) => {
    const { address, owner, error } = await deployAuction(input)
    if (error) return console.log(error.message)
    createAuction({ variables: { input: { ...input, address, owner } } })
  }

  return (
    <div className="rw-segment">
      <div className="rw-segment-main">
        <AuctionForm
          onSave={onSave}
          loading={loading}
          error={error}
          auction={{
            description: 'The coolest NFT in town',
            name: 'My NFT',
            winLength: 30,
          }}
        />
      </div>
    </div>
  )
}

export default NewAuction
