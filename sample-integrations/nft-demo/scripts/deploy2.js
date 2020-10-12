const { web3tx } = require("@decentral.ee/web3-helpers");
const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");
const TradeableCashflow = artifacts.require("TradeableCashflow");

module.exports = async function(callback, argv) {
  const errorHandler = err => {
    if (err) throw err;
  };

  try {
    global.web3 = web3;

    const version = process.env.RELEASE_VERSION || "master";
    console.log("release version:", version);

    const sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: version,
      web3Provider: web3.currentProvider
    });
    await sf.initialize();

    const owner = "0x42D68d4E81087e43e70f6fd56bE4EE356Da3a3aC";
    const name = "StreamableCashflow";
    const symbol = "SCF";
    const daiAddress = await sf.resolver.get("tokens.fDAI");
    const dai = await sf.contracts.TestToken.at(daiAddress);
    const daixWrapper = await sf.getERC20Wrapper(dai);
    const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);

    const app = await web3tx(TradeableCashflow.new, "Deploy TradeableCashflow")(
      owner,
      name,
      symbol,
      sf.host.address,
      sf.agreements.cfa.address,
      daix.address
    );
    console.log("App deployed at", app.address);
    callback();
  } catch (err) {
    callback(err);
  }
};
