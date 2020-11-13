import { parseUnits, formatUnits } from '@ethersproject/units'
import { Contract } from '@ethersproject/contracts'

import SuperfluidSDK from '@superfluid-finance/ethereum-contracts'

import Emanator from 'emanator-contracts/build/contracts/Emanator.json'
import ERC20 from '@superfluid-finance/ethereum-contracts/build/contracts/ERC20.json'

import { getErrorResponse } from './general'
import { unlockBrowser } from './connect'

export const approveAuction = async ({ amount, auctionAddress }) => {
  try {
    const { error, walletProvider, walletAddress } = await unlockBrowser({
      debug: true,
    })
    console.log('Checking approval...')
    const auction = new Contract(
      auctionAddress,
      Emanator.abi,
      walletProvider.getSigner()
    )
    const tokenAddress = await auction.tokenX()
    const token = new Contract(
      tokenAddress,
      ERC20.abi,
      walletProvider.getSigner()
    )
    // Skip approval if unnecessary
    const allowance = await token.allowance(walletAddress, auctionAddress)

    if (allowance.gte(parseUnits(amount.toString(), 18)))
      return { noApprovalNeeded: true }
    const amountBn = parseUnits('10000000', 18)
    const tx = await token.approve(auctionAddress, amountBn)

    return { tx }
  } catch (err) {
    return {
      ...getErrorResponse(err, 'approve'),
    }
  }
}

export const bid = async ({ amount, auctionAddress }) => {
  try {
    const { error, tx: approvalTx, noApprovalNeeded } = await approveAuction({
      amount,
      auctionAddress,
    })
    if (error) throw error.message
    if (noApprovalNeeded) console.log('No approval needed')
    if (approvalTx) await approvalTx.wait()
    console.log('Bidding...')
    const { walletProvider } = await unlockBrowser({
      debug: true,
    })
    const auction = new Contract(
      auctionAddress,
      Emanator.abi,
      walletProvider.getSigner()
    )
    const bidTx = await auction.bid(parseUnits(amount.toString(), 18))

    return { bidTx }
  } catch (err) {
    console.log(err)
    return {
      ...getErrorResponse(err, 'bid'),
    }
  }
}

export const settleAndBeginAuction = async ({ auctionAddress }) => {
  try {
    const { error, walletProvider, walletAddress } = await unlockBrowser({
      debug: true,
    })
    const auction = new Contract(
      auctionAddress,
      Emanator.abi,
      walletProvider.getSigner()
    )
    const tx = await auction.settleAndBeginAuction()
    return { tx }
  } catch (err) {
    return {
      ...getErrorResponse(err, 'settleAndBeginAuction'),
    }
  }
}

export const subscribeToIDA = async ({ auctionAddress }) => {
  try {
    const { error, walletProvider, walletAddress } = await unlockBrowser({
      debug: true,
    })

    const sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: process.env.RELEASE_VERSION || 'test',
      web3Provider: walletProvider.provider,
    })
    await sf.initialize()

    const auction = new Contract(
      auctionAddress,
      Emanator.abi,
      walletProvider.getSigner()
    )
    const host = new Contract(
      sf.host.address,
      sf.contracts.ISuperfluid.abi,
      walletProvider.getSigner()
    )

    const superTokenAddress = await auction.tokenX()

    const tx = await host.callAgreement(
      sf.agreements.ida.address,
      sf.agreements.ida.contract.methods
        .approveSubscription(superTokenAddress, auctionAddress, 0, '0x')
        .encodeABI()
    )
    return { tx }
  } catch (err) {
    console.log(err)
    return {
      ...getErrorResponse(err, 'subscribeToIDA'),
    }
  }
}
