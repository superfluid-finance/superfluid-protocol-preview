import { formatUnits } from '@ethersproject/units'
import { InfuraProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'

import SuperfluidSDK from 'superfluid-finance-ethereum-contracts'

import Emanator from 'emanator-contracts/build/contracts/Emanator.json'

export const web3Auction = async ({ address }) => {
  try {
    const walletlessProvider = new InfuraProvider(
      'goerli',
      process.env.INFURA_ENDPOINT_KEY
    )
    const auction = new Contract(address, Emanator.abi, walletlessProvider)
    const currentGeneration = await auction.currentGeneration()

    let revenue = 0
    let pastAuctions = []

    for (var i = 1; i < currentGeneration; i++) {
      const {
        highBidder: winner,
        revenue: auctionRevenue,
      } = await auction.getAuctionInfo(i)
      const revenueFormatted = Number(formatUnits(auctionRevenue, 18))
      revenue += revenueFormatted
      pastAuctions.push({
        generation: i,
        winner: winner,
        revenue: revenueFormatted,
      })
    }

    const { lastBidTime, highBid, highBidder } = await auction.getAuctionInfo(
      currentGeneration
    )
    const endTime = await auction.checkEndTime()
    const auctionBalance = await auction.getAuctionBalance()

    let lastBidTimeFormatted = lastBidTime.toNumber() * 1000
    let endTimeFormatted = endTime.toNumber() * 1000
    let status = Date.now() < endTimeFormatted ? 'started' : 'ended'
    if (lastBidTimeFormatted === 0) status = 'started'

    return {
      highBidder,
      highBid: Number(formatUnits(highBid, 18)).toFixed(0),
      currentGeneration,
      endTime: endTimeFormatted,
      lastBidTime: lastBidTimeFormatted,
      auctionBalance: Number(formatUnits(auctionBalance, 18)).toFixed(0),
      status,
      pastAuctions,
      revenue,
    }
  } catch (err) {
    return new Error(`Error getting auction ${address}. ${err}`)
  }
}

export const web3User = async ({ address, auctionAddress }) => {
  try {
    const walletlessProvider = new InfuraProvider(
      'goerli',
      process.env.INFURA_ENDPOINT_KEY
    )
    const sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: process.env.RELEASE_VERSION || 'test',
      web3Provider: walletlessProvider,
    })
    await sf.initialize()
    //
    const auction = new Contract(
      auctionAddress,
      Emanator.abi,
      walletlessProvider
    )
    const superTokenAddress = await auction.tokenX()
    const superToken = await sf.contracts.ISuperToken.at(superTokenAddress)
    const superTokenBalance = await superToken.balanceOf(address)
    let isSubscribed = false

    try {
      const { approved } = await sf.agreements.ida.getSubscription(
        superTokenAddress,
        auctionAddress,
        0,
        address
      )
      if (approved) isSubscribed = true
    } catch (err) {
      // console.log(err)
    }

    return {
      superTokenBalance: superTokenBalance.toString(),
      isSubscribed,
    }
  } catch (err) {
    return new Error(`Error getting user ${address}. ${err}`)
  }
}
