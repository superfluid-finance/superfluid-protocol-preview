const {
    web3tx,
    toWad,
    toBN,
} = require("@decentral.ee/web3-helpers");

const { expectRevert } = require("@openzeppelin/test-helpers");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const deployERC1820 = require("@superfluid-finance/ethereum-contracts/scripts/deploy-erc1820");
const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");
const DmsApp = artifacts.require("DmsApp");
const Wallet = artifacts.require("Wallet");

const traveler = require("ganache-time-traveler");
const TEST_TRAVEL_TIME = 3600 * 2; // 1 hours

contract("DmsApp", accounts => {

    const errorHandler = err => { if (err) throw err; };

    const ZERO_ADDRESS = "0x"+"0".repeat(40);
    const FEE = toWad(1).div(toBN(3600*24*30));
    accounts = accounts.slice(0, 3);
    const [admin, alice, bob] = accounts;

    let sf;
    let dai;
    let daix;
    let app;
    let wallet;
    beforeEach(async function () {

        await deployFramework(errorHandler);
        sf = new SuperfluidSDK.Framework({ web3Provider: web3.currentProvider });
        await sf.initialize();

        await deployTestToken(errorHandler, [":", "fDAI"]);
        const daiAddress = await sf.resolver.get("tokens.fDAI");
        dai = await sf.contracts.TestToken.at(daiAddress);
        for (let i = 0; i < accounts.length; ++i) {
            await web3tx(dai.mint, `Account ${i} mints many dai`)(
                accounts[i],
                toWad(10000000),
                { from: accounts[i] }
            );
        }

        console.log(sf.host.address);

        await deployERC1820(errorHandler);
        await deploySuperToken(errorHandler, [":", "fDAI"]);

        const daixWrapper = await sf.getERC20Wrapper(dai);
        daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);

        const testUnderlaying = await daix.getUnderlayingToken();
        console.log("Under: ", testUnderlaying, " DAI: ", dai.address);

        app = await web3tx(DmsApp.new, "Deploy DmsApp")(
            sf.host.address,
            sf.agreements.cfa.address
        );

        wallet = await web3tx(Wallet.new, "Deploy Wallet")(
            { from: alice }
        )

        await web3tx(wallet.transferOwnership, "Wallet: Transfer Ownership to App")(
            app.address, {
                from: alice
            }
        )

        for (let i = 0; i < accounts.length; ++i) {
            await web3tx(dai.approve, `Account ${i} approves daix`)(daix.address, toWad(100), { from: accounts[i] });
        }

    });   

    it("Case #1 - Basic Use", async() => {

        await web3tx(daix.upgrade, `Alice upgrade daix`)(toWad(1), { from: alice });
        const isApp = await sf.host.isApp(app.address);
        console.log("Is app: ", isApp);
        const isJailed = await sf.host.isAppJailed(app.address);
        console.log("Jail: ", isJailed);
        const ownerWallet = await wallet.owner();
        console.log("Owner of Wallet ", ownerWallet);
        //Create a configuration
        await web3tx(app.config, "Dms.config")(
            wallet.address,
            bob, {
                from: alice
            }
        );

        await sf.host.callAgreement(
            sf.agreements.cfa.address,
            sf.agreements.cfa.contract.methods.createFlow(daix.address, app.address, FEE.toString(), "0x").encodeABI(),
            {
                from: alice
            }
        );
        await daix.transferAll(bob, {from: alice });
        await traveler.advanceTimeAndBlock(TEST_TRAVEL_TIME);
        await sf.host.callAgreement(
            sf.agreements.cfa.address,
            sf.agreements.cfa.contract.methods.deleteFlow(daix.address,alice,app.address,"0x").encodeABI(), {
                from: admin
            }
        );

        const newOwnerWallet = await wallet.owner();
        console.log("New owner of Wallet ", newOwnerWallet);
        assert.notEqual(ownerWallet, newOwnerWallet, "Didn't change owner");
    });
});
