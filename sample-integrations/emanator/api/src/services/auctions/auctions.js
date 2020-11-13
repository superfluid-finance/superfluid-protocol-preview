import { db } from 'src/lib/db'

import Emanator from 'emanator-contracts/build/contracts/Emanator.json'

import { Contract } from '@ethersproject/contracts'
import { InfuraProvider } from '@ethersproject/providers'
import { formatUnits } from '@ethersproject/units'

export const auctions = async () => {
  try {
    const auctionsRaw = await db.auction.findMany()

    const walletlessProvider = new InfuraProvider(
      'goerli',
      process.env.INFURA_ENDPOINT_KEY
    )

    const auctions = await auctionsRaw.map(async (auction, i) => {
      const contract = new Contract(
        auction.address,
        Emanator.abi,
        walletlessProvider
      )
      const revenue = Number(formatUnits(await contract.getTotalRevenue(), 18))
      return {
        ...auction,
        revenue,
        generation: await contract.currentGeneration(),
      }
    })
    return auctions
  } catch (err) {
    return new Error(`Error getting auctions. ${err}`)
  }
}

export const auction = ({ address }) => {
  return db.auction.findOne({ where: { address } })
}

export const createAuction = ({ input }) => {
  return db.auction.create({ data: input })
}

export const Auction = {
  bids: (_obj, { root }) =>
    db.auction.findOne({ where: { address: root.address } }).bids(),
}
