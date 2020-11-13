import { useState, useEffect } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { useMutation, useFlash } from '@redwoodjs/web'
import styled from 'styled-components'
import { themeGet } from '@styled-system/theme-get'

import NewAuction from 'src/components/NewAuction'
import Web3UserCell from 'src/components/Web3UserCell/Web3UserCell'
import { Row, Column } from 'src/components/core/Grid'
import Address from 'src/components/core/Address'
import Spacer from 'src/components/core/Spacer'

import { QUERY } from 'src/components/AuctionsCell'

import { bid, settleAndBeginAuction } from 'src/web3/auction'
import { unlockBrowser } from 'src/web3/connect'

const PromptContainer = styled.div`
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  padding: ${themeGet('space.4')};
`

const Container = styled.div`
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
  padding: ${themeGet('space.4')};
`

const CountdownContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${themeGet('space.2')};
`

const Countdown = styled(CountdownCircleTimer)`
  justify-content: center;
  width: 100%;
`

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

const getProgress = ({ auction }) => {
  const { status, endTime, lastBidTime } = auction
  let duration = 0
  let initialRemainingTime = 0
  const end = new Date(endTime)
  const now = new Date()
  const lastBid = new Date(lastBidTime)

  if (status === 'started' && end > now) {
    duration = (end - lastBid) / 1000
    initialRemainingTime = (end - now) / 1000
  }
  return (
    <CountdownContainer>
      <Countdown
        isPlaying
        strokeWidth="18"
        duration={duration}
        initialRemainingTime={initialRemainingTime}
        colors={[
          ['#004777', 0.4],
          ['#F7B801', 0.4],
          ['#A30000', 0.2],
        ]}
      >
        {({ remainingTime }) => {
          const minutes = Math.floor(remainingTime / 60)
          const seconds = remainingTime % 60
          if (remainingTime > 0) return <h1>{`${minutes}:${seconds}`}</h1>
          if (status === 'started') return <>Waiting for first Bid</>
          return (
            <>
              🔨⏳
              <br />
              Auction ended
            </>
          )
        }}
      </Countdown>
    </CountdownContainer>
  )
}

const getPromptBox = (
  status,
  isHighBidder,
  highBid,
  winLength,
  auctionAddress
) => {
  const bidAmount = typeof highBid === 'number' ? Number(highBid) + 5 : '0'
  let onClick = () => bid({ amount: bidAmount, auctionAddress })
  let estTotal = winLength
  let promptText = `Become the high bidder - Bid ${bidAmount} DAI`
  let buttonText = 'approve & bid'
  if (status === 'ended') {
    promptText = 'After settlement, a new auction will begin immediately'
    buttonText = 'Settle Auction'
    onClick = () => settleAndBeginAuction({ auctionAddress })
  }
  if (isHighBidder) promptText = 'You are the highest bidder!'

  return (
    <PromptContainer>
      <Spacer mb={4} />
      <p>{promptText}</p>
      <Spacer mb={4} />
      <div className="rw-button-group">
        <button
          className="rw-button rw-button-blue"
          disabled={isHighBidder}
          onClick={onClick}
        >
          {buttonText}
        </button>
      </div>
    </PromptContainer>
  )
}

const displayAuctionRevenueTable = ({ auction }) => {
  const { pastAuctions, owner, currentGeneration } = auction

  let winnersList = []
  let carryOver = 0
  let ownerRevenue = 0

  pastAuctions.forEach((auction, i) => {
    winnersList.push({
      address: auction.winner,
      generation: auction.generation,
      revenue: 0,
      shares: 100000 * Math.pow(0.9, i),
    })
  })

  pastAuctions.forEach((auction, i) => {
    if (i === 0) ownerRevenue = ownerRevenue + pastAuctions[0].revenue
    if (i === pastAuctions.length - 1) return // The last winner has no revenue, so skip the rest
    const lastRev = pastAuctions[i + 1].revenue
    const dist = lastRev * 0.3

    ownerRevenue = ownerRevenue + lastRev - dist
    const validRecipients = winnersList.slice(0, i + 1)
    const totalShares = validRecipients.reduce(
      (acc, cur) => acc + cur.shares,
      0
    )
    validRecipients.forEach((s, j) => {
      winnersList[j].revenue += (dist * winnersList[j].shares) / totalShares
    })
  })
  winnersList.push({ address: owner, generation: 0, revenue: ownerRevenue })

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Revenue to Date</th>
          </tr>
        </thead>
        <tbody>
          {winnersList
            .sort((a, b) => a.generation - b.generation)
            .map((winner, index) => {
              return (
                <tr key={`${winner.address}-${winner.revenue}`}>
                  <td>
                    <Address address={winner.address}>
                      {index === 0 && 'Creator'}
                    </Address>
                  </td>
                  <td>${winner.revenue.toFixed(2)}</td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

const displayAuctionDetailsTable = ({ auction }) => (
  <>
    <header className="rw-segment-header">
      <h2 className="rw-heading rw-heading-secondary">Details</h2>
    </header>
    <table className="rw-table">
      <tbody>
        <tr>
          <th>High bid</th>
          <td>{auction.highBid}</td>
        </tr>
        <tr>
          <th>High bidder</th>
          <td>
            <Address address={auction.highBidder} />
          </td>
        </tr>
        <tr>
          <th>Last bid time</th>
          <td>{timeTag(auction.lastBidTime)}</td>
        </tr>
        <tr>
          <th>Auction close time</th>
          <td>{timeTag(auction.endTime)}</td>
        </tr>
        <tr>
          <th>Description</th>
          <td>{auction.description}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            <Address address={auction.address} />
          </td>
        </tr>
        <tr>
          <th>Owner</th>
          <td>
            <Address address={auction.owner} />
          </td>
        </tr>
        <tr>
          <th>Launch date</th>
          <td>{timeTag(auction.createdAt)}</td>
        </tr>
      </tbody>
    </table>
  </>
)

const Auction = ({ auction }) => {
  const { addMessage } = useFlash()
  const [walletAddress, setWalletAddress] = useState(null)

  const unlockWallet = async () => {
    const { walletAddress: address, error } = await unlockBrowser({
      debug: true,
    })
    if (error) console.log(error)
    setWalletAddress(address)
  }

  useEffect(() => {
    unlockWallet()
  }, [])

  return (
    <Container>
      <Row gap="10px">
        <Column>
          <h1> {auction.name} </h1>
          <Spacer mb={3} />
          <i>Generation: </i>
          {auction.currentGeneration}
          <br />
          <i>Win time: </i>
          {`${auction.winLength}s`}
          <Spacer mb={5} />
          {getProgress({
            auction,
          })}
          <Spacer mb={3} />
          {getPromptBox(
            auction.status,
            false,
            auction.highBid,
            auction.winLength,
            auction.address
          )}
        </Column>
        <Column sm="auto">
          <Container>
            <h1 className="rw-heading rw-heading-primary">
              ${auction.auctionBalance.toFixed(2)}
            </h1>
            <p>Current Auction Revenue</p>
          </Container>
          {displayAuctionRevenueTable({
            auction,
            bidders: [
              { address: '0xabc', revenue: 101 },
              { address: '0xabc', revenue: 102 },
              { address: '0xabc', revenue: 103 },
            ],
          })}
        </Column>
      </Row>
      <Spacer mb={5} />
      <Row gap="10px">
        <Column>
          {walletAddress && (
            <Web3UserCell
              address={walletAddress}
              auctionAddress={auction.address}
            />
          )}
        </Column>
        <Column>{displayAuctionDetailsTable({ auction })}</Column>
      </Row>
    </Container>
  )
}

export default Auction
