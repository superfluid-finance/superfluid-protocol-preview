const SuperfluidSDK = require("../ethereum-contracts");

// To run the script"
// - go to ethereum-contracts directory
// - setup your env file with these variables:
//    - `GOERLI_MNEMONIC` - your mnemonic
//    - `GOERLI_PROVIDER_URL` - your goerli web3 provider url
// - and run: `npx truffle --network goerli`
// - then in the console: `exec ../test-scripts/console-quick-start.js`

module.exports = async function (callback) {
  global.web3 = web3;

  try {
    const accounts = await web3.eth.getAccounts();
    const bob = accounts[0];
    const alice = accounts[1];
    const dan = accounts[2];
    const minAmount = web3.utils.toWei("100", "ether");

    const sf = new SuperfluidSDK.Framework({
      version: "preview-20200928",
      web3Provider: web3.currentProvider,
    });
    await sf.initialize();
    const daiAddress = await sf.resolver.get("tokens.fDAI");
    const dai = await sf.contracts.TestToken.at(daiAddress);
    const daixWrapper = await sf.getERC20Wrapper(dai);
    const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);
    console.log("daix address", daix.address);

    // minting
    if (
      web3.utils.toBN(await daix.balanceOf(bob)).lt(web3.utils.toBN(minAmount))
    ) {
      console.log("Minting and upgrading...");
      await dai.mint(bob, minAmount, { from: bob });
      await dai.approve(daix.address, minAmount, { from: bob });
      await daix.upgrade(minAmount, { from: bob });
      console.log("Done minting and upgrading.");
    }
    console.log(
      "bob balance ",
      (await daix.balanceOf(bob))
    );
    console.log(
      "alice balance ",
      (await daix.balanceOf(alice))
    );
    console.log(
      "dan balance ",
      (await daix.balanceOf(dan))
    );
    console.log(
      "bob net flow",
      (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString()
    );
    console.log("Ready to interact with Superfluid!");
    callback()
  } catch (err) {
    callback(err)
  }
};
