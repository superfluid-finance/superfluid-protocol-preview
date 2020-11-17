# Emanator

> Perpetual distribution of NFT-linked content

## How it works

The app allows a NFT creator/artist/musician to mint a continuous supply of NFTs, which are sold via auction. The NFT could grant access to an album download, or a newsletter subscription. Proceeds from every auction are automatically sent to all previous auction winners using the Superfluid Instant Distribution Agreement (IDA). Each time an auction closes, 70% of the revenue goes to the original NFT creator. The remaining revenue is divided among previous winners using the IDA, and shares are given to the latest winner so they can receive future revenue.

This allows the creator to distribute content in a manner, which

1. Provides incentives for "early adopters"
2. Mobilizes communities, creating a large network effect
3. Disseminates NFT-based content in a fair manner since a fair price is always established (where the name comes from: dis-"emanator")

In order to win an auction, a bidder must maintain the highest bid (in DAIx) for an amount of time specified by the creator. If someone else bids higher, they become the new highest bidder and the clock resets. All bids, even non-winning bids, are taken by auction and distributed as revenue.

The Superfluid Instant Distribution Agreement allowed us to easily handle distribution of revenue, without having to store previous winner data in the contract. We simply send shares to the new winner using `updateSubscription()`, and don't worry about the rest.

```sol
host.callAgreement(
  ida,
  abi.encodeWithSelector(
    ida.updateSubscription.selector,
    tokenX,
    INDEX_ID,
    _auction.highBidder,
    getSharesOf(_auction.highBidder) + shareAmount,
    new bytes(0)
  )
);
```

Distributing the funds is also very easy since its just a single function call `distribute()`. We don't need no stinkin' for-loops here my friends!

```sol
uint distributeAmount = rmul(tokenX.balanceOf(address(this)), rdiv(3, 10));
host.callAgreement(
    ida,
    abi.encodeWithSelector(
        ida.distribute.selector,
        tokenX,
        INDEX_ID,
        distributeAmount,
        new bytes(0)
    )
);
```

The rest of the contract is pretty straight-forward. Every time an auction is settled, the revenue is distributed, and a new one auction is started.

## What we enjoyed

The Superfluid SDK was really easy to use and set up. One of the biggest pains when learning a new protocol is just hunting down addresses for things. The SDK includes the SF router and makes it so all you need is to tell it the version you want. It even includes contracts for minting test token too- pretty nifty!

## Issues we encountered

- Normally I can call functions which require approval (eg. the bid function), and submit them on-chain before the approval transaction is actually completed. This doesn't seem to work for SuperTokens.
- When I do make an approval, later when I check the approved amount it always seems to be slightly less than the amount I actually approved. Weird (maybe something I am doing).
- When deploying my serverless functions, I hit a size limit. Some of the dependencies I needed like `@truffle/contract` and `web3` were just too dang large. I ended up trying to rewrite the SF SDK to use `ethers.js`, which you can find here in the `js-sdk` package, but I gave up after a while and decided to self-host the app using the [tutorial](https://redwoodjs.com/cookbook/self-hosting-redwood).
- For some reason we can't distribute tokens until at least one person has subscribed to the IDA. Not sure if this is a requirement, or we are doing something wrong.
- Mixing database queries and web3 queries can get complicated, and slows down load times. I am hopeful that I can find a better way to do this, without having to rely on TheGraph infrastructure. I think redwoodjs is a very good candidate for making a simple feather-weight version of TheGraph.

## Going forward

We really wanted to also incorporate the Constant Flow Agreement into the app, but did not have enough time. Ideally, the auction is won by _streaming the most tokens_ for a certain amount of time, rather than just having the highest bid. When a higher bid (in tokens/second) is placed, it would automatically cancel the previous bidders stream, and replace it with the new one. Things could get really complicated fast! But it could also add a lot of interesting features to the auction mechanics.

## Thats all folks!

The rest of this readme is dev-stuff for running the app.

## Run it!

If you want to run it locally to poke around, you can do so easily using redwood-js! I've included some docs below that may help if this is your first time using it.

```bash
yarn

cp .env.example .env

# Init the local database
# ONLY DO THIS ONCE
yarn rw db save
yarn rw db up

# Start serverless and app
yarn rw dev
```

To get some Goerli DAIx, I've included a convenience script. (You can also try using the SF dashboard).

```bash
cd contracts
cp .env.example .env
# Add your wallet mnemonic

yarn getTokens
```

You should now have enough to play with the auction.

# Redwood Docs

> **WARNING:** RedwoodJS software has not reached a stable version 1.0 and should not be considered suitable for production use. In the "make it work; make it right; make it fast" paradigm, Redwood is in the later stages of the "make it work" phase.

## Getting Started

- [Tutorial](https://redwoodjs.com/tutorial/welcome-to-redwood): getting started and complete overview guide.
- [Docs](https://redwoodjs.com/docs/introduction): using the Redwood Router, handling assets and files, list of command-line tools, and more.
- [Redwood Community](https://community.redwoodjs.com): get help, share tips and tricks, and collaborate on everything about RedwoodJS.

### Setup

We use Yarn as our package manager. To get the dependencies installed, just do this in the root directory:

```terminal
yarn install
```

### Fire it up

```terminal
yarn redwood dev
```

Your browser should open automatically to `http://localhost:8910` to see the web app. Lambda functions run on `http://localhost:8911` and are also proxied to `http://localhost:8910/.redwood/functions/*`.
