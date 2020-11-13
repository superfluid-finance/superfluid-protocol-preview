const { web3tx, toWad, toBN, wad4human } = require('@decentral.ee/web3-helpers')
const { time, expectRevert } = require('@openzeppelin/test-helpers')
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework')
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token')
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token')
const SuperfluidSDK = require('@superfluid-finance/ethereum-contracts')
const Emanator = artifacts.require('Emanator')

contract('Emanator', (accounts) => {
  const errorHandler = (err) => {
    if (err) throw err
  }

  const ZERO_ADDRESS = '0x' + '0'.repeat(40)
  const MINIMUM_GAME_FLOW_RATE = toWad(10).div(toBN(3600 * 24 * 30))
  const WIN_LENGTH = 20 // seconds

  accounts = accounts.slice(0, 4)
  const [creator, bob, carol, dan] = accounts

  let sf
  let dai
  let daix
  let app

  beforeEach(async function () {
    await deployFramework(errorHandler)

    sf = new SuperfluidSDK.Framework({ web3Provider: web3.currentProvider })
    await sf.initialize()

    if (!dai) {
      await deployTestToken(errorHandler, [':', 'fDAI'])
      const daiAddress = await sf.resolver.get('tokens.fDAI')
      dai = await sf.contracts.TestToken.at(daiAddress)
      for (let i = 0; i < accounts.length; ++i) {
        await web3tx(dai.mint, `Account ${i} mints many dai`)(
          accounts[i],
          toWad(10000000),
          { from: accounts[i] }
        )
      }
    }

    await deploySuperToken(errorHandler, [':', 'fDAI'])

    const daixWrapper = await sf.getERC20Wrapper(dai)
    daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress)

    app = await web3tx(Emanator.new, 'Deploy Emanator')(
      sf.host.address,
      sf.agreements.cfa.address,
      sf.agreements.ida.address,
      daix.address,
      WIN_LENGTH
    )

    for (let i = 1; i < accounts.length; ++i) {
      await web3tx(dai.approve, `Account ${i} approves daix`)(
        daix.address,
        toWad(100000000),
        { from: accounts[i] }
      )
      await web3tx(daix.upgrade, `Account ${i} upgrades dai`)(toWad(1000), {
        from: accounts[i],
      })
      await web3tx(
        daix.approve,
        `Account ${i} approves Emanator contract`
      )(app.address, toWad(100000000), { from: accounts[i] })
      await web3tx(
        sf.host.callAgreement,
        `Account ${i} approves subscription to the app`
      )(
        sf.agreements.ida.address,
        sf.agreements.ida.contract.methods
          .approveSubscription(daix.address, app.address, 0, '0x')
          .encodeABI(),
        {
          from: accounts[i],
        }
      )
    }
  })

  async function printRealtimeBalance(label, account) {
    const { availableBalance } = await daix.realtimeBalanceOfNow.call(account)
    return console.log(`${label} rtb: `, wad4human(availableBalance))
  }

  async function printShares(label, account) {
    const shares = await app.getSharesOf.call(account)
    return console.log(`${label} shares: `, shares.toString())
  }

  // it('Deploys the contract', async () => {
  //   assert.equal(await app.getAuctionBalance.call(), 0)
  //   await web3tx(app.bid, `Account ${bob} bids 10`)(toWad(10), { from: bob })
  //   assert.equal(
  //     (await app.getAuctionBalance.call()).toString(),
  //     toWad(10).toString()
  //   )
  // })
  //
  // it('sets Bob as the high bidder', async () => {
  //   assert.equal(await app.getHighBidder.call(), ZERO_ADDRESS)
  //   await web3tx(app.bid, `Account ${bob} bids 10`)(toWad(10), { from: bob })
  //   assert.equal((await app.getHighBidder.call()).toString(), bob.toString())
  // })
  //
  // it('allows multiple bids', async () => {
  //   assert.equal(await app.getAuctionBalance.call(), 0)
  //   await web3tx(app.bid, `Account ${bob} bids 10`)(toWad(10), { from: bob })
  //   appRealtimeBalance = await printRealtimeBalance('App', app.address)
  //   await printRealtimeBalance('Bob', bob)
  //   let timeLeft = await app.checkTimeRemaining()
  //   console.log(timeLeft)
  //   await web3tx(app.bid, `Account ${carol} bids 20`)(toWad(20), {
  //     from: carol,
  //   })
  //   console.log(timeLeft)
  //   appRealtimeBalance = await printRealtimeBalance('App', app.address)
  //   await printRealtimeBalance('Carol', carol)
  //   assert.equal(
  //     (await app.getAuctionBalance.call()).toString(),
  //     toWad(30).toString()
  //   )
  //   assert.equal((await app.getHighBidder.call()).toString(), carol.toString())
  // })
  //
  // it('does not allow bids after the auction is over', async () => {
  //   assert.equal(await app.getHighBidder.call(), ZERO_ADDRESS)
  //   await web3tx(app.bid, `Account ${bob} bids 10`)(toWad(10), { from: bob })
  //   let timeLeft = await app.checkTimeRemaining()
  //   time.increase(timeLeft + 1)
  //   await web3tx(app.bid, `Account ${carol} bids 20`)(toWad(20), {
  //     from: carol,
  //   })
  //     .then(assert.fail)
  //     .catch(function (error) {
  //       assert.include(
  //         error.message,
  //         'revert',
  //         'bids submitted after an auction ends should revert'
  //       )
  //     })
  //   assert.equal((await app.getHighBidder.call()).toString(), bob.toString())
  // })
  //
  // it('allows settling an auction and starting a new auction', async () => {
  //   assert.equal(await app.getHighBidder.call(), ZERO_ADDRESS)
  //   await web3tx(app.bid, `Account ${bob} bids 10`)(toWad(10), { from: bob })
  //   let timeLeft = await app.checkTimeRemaining()
  //   time.increase(timeLeft + 1)
  //   await web3tx(
  //     app.settleAndBeginAuction,
  //     `Account ${bob} settles the auction`
  //   )({ from: bob })
  //   assert.equal(await app.currentGeneration.call(), '2')
  // })

  const runAuction = async (bids) => {
    console.log(
      `======= New auction - Generation ${await app.currentGeneration.call()} =======`
    )
    await bids.forEach(async (bid) => {
      await web3tx(app.bid, `${bid.label} bids ${bid.amount}`)(
        toWad(bid.amount),
        { from: bid.account }
      )
    })
    let timeLeft = await app.checkTimeRemaining()
    time.increase(timeLeft + 1)
    console.log('---AUCTION ENDED---')
    await printRealtimeBalance('Auction revenue generated', app.address)
    await web3tx(
      app.settleAndBeginAuction,
      `Bob settles the auction`
    )({ from: bob })
    console.log('---AUCTION SETTLED---')
    await printRealtimeBalance('Auction', app.address)
    await printRealtimeBalance('Creator', creator)
    await printRealtimeBalance('Bob', bob)
    await printShares('Bob', bob)
    await printRealtimeBalance('Carol', carol)
    await printShares('Carol', carol)
    await printRealtimeBalance('Dan', dan)
    await printShares('Dan', dan)
  }

  it('transfers 70% of the second auction revenue to the creator and 30% to the winner of auction 1', async () => {
    await printRealtimeBalance('Auction Contract', app.address)
    await printRealtimeBalance('Creator', creator)
    await printRealtimeBalance('Bob', bob)
    await printRealtimeBalance('Dan', dan)
    await printRealtimeBalance('Carol', carol)

    ////// NEW AUCTION - Generation 1 /////
    let bids = [{ account: bob, amount: 10, label: 'Bob' }]
    await runAuction(bids)

    ////// NEW AUCTION - Generation 2 /////
    bids = [{ account: carol, amount: 10, label: 'Carol' }]
    await runAuction(bids)

    ////// NEW AUCTION - Generation 3 /////
    bids = [{ account: dan, amount: 100, label: 'Dan' }]
    await runAuction(bids)

    ////// NEW AUCTION - Generation 4 /////
    bids = [{ account: dan, amount: 100, label: 'Dan' }]
    await runAuction(bids)

    // TODO : write logic to check the expected distribution split
  })
})
