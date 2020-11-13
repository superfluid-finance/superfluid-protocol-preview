In this post I'll walk you through how I used `redwood-js` to create an ethereum dapp.

The key advantages to using this framework, as opposed to create-react-app, is that its built for graphql.

Do it now!

```
yarn create redwood-app ./redwoodblog
```

### Resources

- https://redwoodjs.com/docs/cli-commands

## Setting up the App

```bash
yarn rw generate layout default
yarn rw generate page home /
yarn rw generate page auction {auctionAddress}
```

## Database setup

Update `schema.prisma` to add the auction object

```
model Auction {
  id Int @id @default(autoincrement())
  address String @unique
  name String
  winLength Int
  owner String
  description String?
  createdAt  DateTime  @default(now())
  status String @default("started")
  highBid Int @default(0)
  generation Int @default(0)
  revenue Int @default(0)
}
```

Now we can create our local development database

```bash
yarn rw db save
yarn rw db up
```

Finally we will use `schema.prisma` to generate some components for us.

```bash
yarn rw generate scaffold Auction
```

I didn't need some of the edit/delete functionality (blockchain is immutable?), so I removed a few components and routes.

We should now be able to create new auctions by entering dummy data.

## Edit the form

Now we need to add functionality to deploy the contract. Once we can deploy a new auction, we can use the contract address and owner address to populate our database.

I've added the deployment script to `web/src/web3/deploy.js`. The return values from `deployAuction()` are added to the mutation like this:

```js
// web/src/components/NewAuction/NewAuction.js
const onSave = async (input) => {
  const { address, owner, error } = await deployAuction(input)
  if (error) return console.log(error.message)
  createAuction({ variables: { input: { ...input, address, owner } } })
}
```

## Fetch web3 data

I followed the example for [Using a Third Party API](https://redwoodjs.com/cookbook/using-a-third-party-api#server-side-api-integration) for fetching web3 data. I choose to use the server rather than the app to make Web3 calls, because it makes things much simpler to work with.

> Note: Rather than follow the Redwood established pattern of grouping the SDL and Services by Type (ie. Web3Auction, Web3User) I grouped them under "Web3".

1. Define the schema in `web3.sdl.js`.

```
type Web3User {
  superTokenBalance: String!
  isSubscribed: Boolean!
}

type Query {
  web3User(address: String!, auctionAddress: String!): Web3User!
  // ...
}
```

> Note: Since web3 data is external to our database, we do not update `schema.prisma`. Additionally, we cannot use the `yarn rw scaffold` command for the external data since it uses `schema.prisma`.

2. Create the service file `services/web3/web3.js`. Add the Web3 calls.

```bash
yarn rw g service web3
```

3. Write the queries in the graphql playground

```
query GET_WEB3_USER($address: String!, $auctionAddress: String!) {
  web3User(address:$address, auctionAddress: $auctionAddress) {
    superTokenBalance
    isSubscribed
  }
```

## Display web3 data

Now that we have some new Web3 queries, there are two ways to use them.

Option 1: Make a new component

For Users, I only care about Web3 data, so I chose to make a new cell and component.

```bash
yarn rw g cell web3User
yarn rw g component web3User
```

Option 2: Combine with existing components

For Auctions I wanted to use data from both the Database and Web3, so I elected to add the new query to the existing one. I did not make any new components.

```
// AuctionCell.js
query FIND_AUCTION_BY_ADDRESS($address: String!) {
  auction(address: $address) {
    id
    name
    address
    description
    createdAt
    revenue
    winLength
    owner
  }
  web3Auction(address: $address) {
    endTime
    lastBidTime
    auctionBalance
    highBid
    highBidder
    status
  }
}
```

## Staying updated with Web3

As a quick and dirty way to keep the app up-to-date with Web3 data, I added the following function to `Auctioncell.js` and `Web3UserCell.js` (see [Generating a Cell](https://redwoodjs.com/docs/cells#beforequery)). This could be done a better way, but it works for now.

```js
export const beforeQuery = (props) => {
  return { variables: props, fetchPolicy: 'network-only', pollInterval: 5000 }
}
```

## Challenge: keep the Database in-sync with Web3

Right now, when a new auction is deployed, the database is updated with the immediately, without waiting to see if the deployment is successful. A better solution would be to wait for the deployment to succeed before creating the database entry. If we write this logic on the app, the user may close the page before it can finish, and the database will not include the freshly deployed auction.

Instead we should have the server wait on the pending transaction, instead of the app.

## Deployment

Since I already had a Vercel account, I chose to go with them for hosting the serverless app, and Heroku for the database. In total it took about 30 minutes. I just followed the tutorial [here](https://redwoodjs.com/tutorial/deployment).

The only issue I encountered was that `yarn rw build` was not building my contracts. I solved this by adding to the build command:

```js
// Default
yarn rw build && yarn rw db up --no-db-client --auto-approve && yarn rw dataMigrate up

// Now contracts are built first
cd contracts && yarn build && cd .. && yarn rw build //...
```

However, Vercel complained that my serverless function was too large by about 5mb. I know that compiled contracts can be fairly large, so I checked the contract build folder which was was 7mb unzipped. Since the API only needed a single contract (`emanator.json`), I decided to check the build folder into git and remove the unnecessary contracts. I quickly pushed up my changes and reverted the build command back to the original one.

Unfortunately this didn't make much of a difference. Thanks to some helpful advice from the Redwood Discord, and some Github issue hunting, I learned of a tool to help [find the culprit](https://github.com/redwoodjs/redwood/issues/1196#issuecomment-723562940). I discovered that `truffle` was eating up a ton of space. I'm not sure how it was included in the build, despite being a development dependency. I removed truffle from devDependencies (err...ok?) but was still getting some `@truffle` dependencies due to `@openzeppelin/test-helpers`. Now pretty frustrated, I _blew away all devDependencies_ in the `contracts` package, deleted `yarn.lock` and prayed - "Oh mighty dependency gods, please bless me safe passage"!

```
yarn rw build api
yarn zip-it-and-ship-it api/dist/functions/ zipped
```

I was now down to 62mb from ~72mb, which is still over the 50mb limit, but maybe Vercel builds/bundles things differently than the Netlify tool I was using? Lets hope so! While this is deploying, I'll start making a Netlify account, which has a 69.9mb limit...just in case.

- Added back the `binaryTarget` in attempt to switch to netlify, but that increased the zipped size to 72mb
- Added back the devDependencies, which changed to 73.2mb
-

### Notes

`yarn rw generate scaffold` Does not work perfectly for all prisma relations. See https://redwoodjs.com/docs/schema-relations
