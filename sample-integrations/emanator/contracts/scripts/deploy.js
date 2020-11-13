const { web3tx } = require('@decentral.ee/web3-helpers')
const SuperfluidSDK = require('@superfluid-finance/ethereum-contracts')
const Emanator = artifacts.require('Emanator')

const WIN_LENGTH = 10 // seconds

module.exports = async function (callback, argv) {
  const errorHandler = (err) => {
    if (err) throw err
  }

  try {
    global.web3 = web3

    const version = process.env.RELEASE_VERSION || 'test'
    console.log('release version:', version)

    const sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: version,
      web3Provider: web3.currentProvider,
    })
    await sf.initialize()

    const daiAddress = await sf.resolver.get('tokens.fDAI')
    const dai = await sf.contracts.TestToken.at(daiAddress)
    const daixWrapper = await sf.getERC20Wrapper(dai)
    const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress)

    const app = await web3tx(Emanator.new, 'Deploy Emanator')(
      sf.host.address,
      sf.agreements.cfa.address,
      sf.agreements.ida.address,
      daix.address,
      WIN_LENGTH
    )
    console.log('App deployed at', app.address)
    callback()
  } catch (err) {
    callback(err)
  }
}
