import { useFlash } from '@redwoodjs/web'
import { navigate, routes } from '@redwoodjs/router'
import Link from 'src/components/core/Link'

import { QUERY } from 'src/components/AuctionsCell'

const MAX_STRING_LENGTH = 150

const truncate = (text) => {
  let output = text
  if (text && text.length > MAX_STRING_LENGTH) {
    output = output.substring(0, MAX_STRING_LENGTH) + '...'
  }
  return output
}

const jsonTruncate = (obj) => {
  return truncate(JSON.stringify(obj, null, 2))
}

const timeTag = (datetime) => {
  return (
    <time dateTime={datetime} title={datetime}>
      {new Date(datetime).toUTCString()}
    </time>
  )
}

const checkboxInputTag = (checked) => {
  return <input type="checkbox" checked={checked} disabled />
}

const AuctionsList = ({ auctions }) => {
  const { addMessage } = useFlash()
  console.log(auctions)
  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Generations</th>
            <th>Revenue</th>
            <th>Date Created</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((auction) => (
            <tr key={auction.id}>
              <td>
                <Link
                  underline
                  onClick={() =>
                    navigate(routes.auction({ address: auction.address }))
                  }
                >
                  {truncate(auction.name)}
                </Link>
              </td>
              <td>{truncate(auction.generation)}</td>
              <td>{truncate(auction.revenue)}</td>
              <td>{timeTag(auction.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AuctionsList
