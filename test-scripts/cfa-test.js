const SuperfluidSDK = require("../ethereum-contracts")

// To run the script"
// - go to ethereum-contracts directory
// - setup your env file with these variables:
//    - `GOERLI_MNEMONIC` - your mnemonic
//    - `GOERLI_PROVIDER_URL` - your goerli web3 provider url
// - and run: `npx truffle --network goerli exec ../test-scripts/test.js`
module.exports = async function (callback) {
    global.web3 = web3;

    try {
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];
        const bob = accounts[1];
        const minAmount = web3.utils.toWei("100", "ether");

        const sf = new SuperfluidSDK.Framework({version: "preview-20200928", web3Provider: web3.currentProvider });
        await sf.initialize();
        const daiAddress = await sf.resolver.get("tokens.fDAI");
        const dai = await sf.contracts.TestToken.at(daiAddress);
        const daixWrapper = await sf.getERC20Wrapper(dai);
        const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);
        console.log("daix address", daix.address);

        // minting
        if (web3.utils.toBN(await daix.balanceOf(admin)).lt(web3.utils.toBN(minAmount))) {
            console.log("Minting and upgrading...");
            await dai.mint(admin, minAmount, { from: admin });
            await dai.approve(daix.address, minAmount, { from: admin });
            await daix.upgrade(minAmount, { from: admin });
            console.log("Done minting and upgrading.");
        }
        console.log("admin balance", (await daix.balanceOf(admin)).toString());
        console.log("bob balance", (await daix.balanceOf(bob)).toString());

        if ((await sf.agreements.cfa.getFlow(daix.address, admin, bob)).timestamp) {
            console.log("Deleting the existing flow...");
            await sf.host.callAgreement(
                sf.agreements.cfa.address,
                sf.agreements.cfa.contract.methods.deleteFlow(
                    daix.address, admin, bob, "0x"
                ).encodeABI(), {
                    from: admin
                }
            );
            console.log("Flow deleted.");
        }

        console.log("Creating a new flow...");
        await sf.host.callAgreement(
            sf.agreements.cfa.address,
            sf.agreements.cfa.contract.methods.createFlow(
                daix.address, bob, "385802469135802", "0x"
            ).encodeABI(), {
                from: admin
            }
        );
        console.log("Flow created.")

        console.log("Admin net flow", (await sf.agreements.cfa.getNetFlow(daix.address, admin)).toString());
        console.log("Bob net flow", (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString());
        callback();
    } catch (err) {
        callback(err);
    }
}

