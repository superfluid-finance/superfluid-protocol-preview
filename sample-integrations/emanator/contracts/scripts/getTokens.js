const { web3tx } = require('@decentral.ee/web3-helpers')
const SuperfluidSDK = require('@superfluid-finance/ethereum-contracts')

module.exports = async function (callback, argv) {
  const errorHandler = (err) => {
    if (err) throw err
  }
  global.web3 = web3

  try {
    const accounts = await web3.eth.getAccounts()
    const admin = accounts[0]
    const minAmount = web3.utils.toWei('100', 'ether')

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
    console.log('DAIx ', daix.address)
    if (
      web3.utils
        .toBN(await daix.balanceOf(admin))
        .lt(web3.utils.toBN(minAmount))
    ) {
      console.log('Minting and upgrading...')
      await dai.mint(admin, minAmount, { from: admin })
      await dai.approve(daix.address, minAmount, { from: admin })
      await daix.upgrade(minAmount, { from: admin })
      console.log('Done minting and upgrading.')
    }
    console.log('Your DAIx balance', (await daix.balanceOf(admin)).toString())

    callback()
  } catch (err) {
    callback(err)
  }
}
