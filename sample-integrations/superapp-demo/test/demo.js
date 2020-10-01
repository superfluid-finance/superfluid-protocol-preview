const { web3tx } = require("@decentral.ee/web3-helpers");
const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");
const deploy = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-environment");
const LotterySuperApp = artifacts.require("LotterySuperApp");

contract("LotterySuperApp", accounts => {

    const errorHandler = err => { if (err) throw err; };

    let sf;
    let daix;

    beforeEach(async function () {
        await deploy(errorHandler);
        sf = new SuperfluidSDK.Framework({ web3Provider: web3.currentProvider });
        await sf.initialize();

        const daiAddress = await sf.resolver.get("tokens.fDAI");
        const dai = await sf.contracts.TestToken.at(daiAddress);
        const daixWrapper = await sf.getERC20Wrapper(dai);
        daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);

        await web3tx(LotterySuperApp.new, "Deploy LotterySuperApp")(
            sf.host.address,
            sf.agreements.cfa.address,
            daix.address
        );
    });   

    it("Full game", async () => {
        // ...
    })
});
