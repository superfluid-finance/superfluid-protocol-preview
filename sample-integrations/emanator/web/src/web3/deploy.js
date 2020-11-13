import { Contract, ContractFactory } from '@ethersproject/contracts'
import SuperfluidSDK from '@superfluid-finance/ethereum-contracts'

import Emanator from 'emanator-contracts/build/contracts/Emanator.json'

import { getErrorResponse } from './general'
import { unlockBrowser } from './connect'

export const deployAuction = async ({ winLength }) => {
  try {
    const { walletAddress, error, walletProvider } = await unlockBrowser({
      debug: true,
    })

    const version = process.env.RELEASE_VERSION || 'test'
    console.log('release version:', version)

    const sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: version,
      web3Provider: walletProvider.provider,
    })
    await sf.initialize()

    const daiAddress = await sf.resolver.get('tokens.fDAI')
    const dai = await sf.contracts.TestToken.at(daiAddress)
    const daixWrapper = await sf.getERC20Wrapper(dai)
    const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress)

    const factory = new ContractFactory(
      Emanator.abi,
      Emanator.bytecode,
      walletProvider.getSigner()
    )

    const contract = await factory.deploy(
      sf.host.address,
      sf.agreements.cfa.address,
      sf.agreements.ida.address,
      daix.address,
      winLength
    )
    // const receipt = await contract.deployTransaction.wait()
    // // console.log(receipt)
    // if (receipt.status === 0) return { error: receipt }

    const { address } = contract
    console.log('App deployed at', address)
    return { address, owner: walletAddress }
  } catch (err) {
    return {
      ...getErrorResponse(err, 'deploy'),
    }
  }
}
