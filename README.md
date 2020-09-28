# Superfluid Protocol (Preview)

Welcome to the preview version of the Superfluid protocol.

## Ethereum Contracts

The ethereum contracts is published under the `ethereum-contracts` folder.

Currently the core logics are not yet published publicly, but they will be coming very soon!

### Integration

Install the SDK and its peer dependency:

```
$ npm install --save @superfluid-finance/ethereum-contracts
$ npm install --save @truffle/contract
```

To start with the SDK (with Goerli testnet):

```
const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");
const sf = new SuperfluidSDK.Framework({
    version: "preview-20200928", // This is for using different protocol release
    web3Provider: web3.currentProvider // your web3 provider
});
```

For more information about the SDK, read [SDK Integration](ethereum-contracts/README.md#integration).

For more information about the protocol, please visit [docs](https://docs.superfluid.finance/).

## Example Dapps

Coming soon...

# Further Readings

To read more about Superfluid Finance and our vision, please visit [our website](https://www.superfluid.finance/).
