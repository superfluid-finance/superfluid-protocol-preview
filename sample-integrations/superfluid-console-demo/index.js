require("dotenv").config();
const Web3 = require("web3");
const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");
const HDWalletProvider = require("@truffle/hdwallet-provider");

if (!process.env.GOERLI_MNEMONIC ||
    !process.env.GOERLI_PROVIDER_URL) {
  console.error("add GOERLI_MNEMONIC and GOERLI_PROVIDER_URL to your .env file");
  process.exit(1);
}

async function main() {
  const web3Provider = new HDWalletProvider(
    process.env.GOERLI_MNEMONIC,
    process.env.GOERLI_PROVIDER_URL
  );
  const web3 = new Web3(web3Provider);
  const accounts = web3Provider.addresses;
  const minAmount = web3.utils.toBN(web3.utils.toWei("100", "ether"));
  const sf = new SuperfluidSDK.Framework({
    chainId: 5,
    version: process.env.RELEASE_VERSION || "preview-20200928", // This is for using different protocol release
    web3Provider: web3Provider // your web3 provider
  });
  await sf.initialize();

  const daiAddress = await sf.resolver.get("tokens.fDAI");
  const dai = await sf.contracts.TestToken.at(daiAddress);
  const daixWrapper = await sf.getERC20Wrapper(dai);
  const daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);
  console.log("daix address", daix.address);

  const admin = accounts[0];
  const bob = accounts[1];
  const adminBalance = web3.utils.toBN(await daix.balanceOf(admin));
  console.log("admin", admin, adminBalance.toString());
  console.log("bob", bob);

  // minting
  if (adminBalance.lt(minAmount.div(web3.utils.toBN(2)))) {
    console.log("Minting and upgrading...");
    await dai.mint(admin, minAmount, { from: admin });
    await dai.approve(daix.address, minAmount, { from: admin });
    await daix.upgrade(minAmount, { from: admin });
    console.log("Done minting and upgrading.");
  }
  //console.log("admin balance", (await daix.balanceOf(admin)).toString());
  //console.log("bob balance", (await daix.balanceOf(bob)).toString());

  console.log(
    "Admin net flow",
    (await sf.agreements.cfa.getNetFlow(daix.address, admin)).toString()
  );
  console.log(
    "Bob net flow",
    (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString()
  );

  // create flow
  const currentFlowData = await sf.agreements.cfa.getFlow(
    daix.address,
    admin,
    bob
  );
  const hasExistingFlow = currentFlowData.timestamp.toString() != "0";
  if (hasExistingFlow && process.env.RESET_FLOW) {
    console.log("Deleting the existing flow...");
    await sf.host.callAgreement(
      sf.agreements.cfa.address,
      sf.agreements.cfa.contract.methods
        .deleteFlow(daix.address, admin, bob, "0x")
        .encodeABI(),
      {
        from: admin
      }
    );
    console.log("Flow deleted.");
    console.log(
      "Admin net flow: ",
      (await sf.agreements.cfa.getNetFlow(daix.address, admin)).toString()
    );
    console.log(
      "Bob net flow: ",
      (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString()
    );
    hasExistingFlow = false;
  }

  if (!hasExistingFlow) {
    console.log("Creating a new flow...");
    await sf.host.callAgreement(
      sf.agreements.cfa.address,
      sf.agreements.cfa.contract.methods
        .createFlow(daix.address, bob, "385802469135802", "0x")
        .encodeABI(),
      {
        from: admin
      }
    );
    console.log("Flow created.");
    console.log("Admin net flow: ",
      (await sf.agreements.cfa.getNetFlow(daix.address, admin)).toString()
    );
    console.log("Bob net flow: ",
      (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString()
    );
  }

  // check net flow rates
  process.stdout.write("\nlive updating balance:\n");
  process.stdout.write("\nAdmin netFlow:      ");
  process.stdout.write(
    (await sf.agreements.cfa.getNetFlow(daix.address, admin)).toString()
  );
  process.stdout.write(" -  Bob netFlow:     ");
  process.stdout.write(
    (await sf.agreements.cfa.getNetFlow(daix.address, bob)).toString()
  );
  process.stdout.write("\n");
  var adminB, bobB, oldAdminB, oldBobB;
  var p = 0;
  process.stdout.setEncoding("utf8");
  var spinner = ".  ";
  while (p < 1000) {
    oldAdminB = adminB;
    oldBobB = bobB;
    adminB = (await daix.balanceOf(admin)).toString();
    bobB = (await daix.balanceOf(bob)).toString();
    (async () => {
      return new Promise(resolve => {
        setTimeout(resolve => {
          process.stdout.write("\r\x1b[K");
          process.stdout.write("Admin balance: ");
          process.stdout.write(adminB);
          process.stdout.write(" -  Bob balance: ");
          process.stdout.write(bobB);
          process.stdout.write("   ");
          process.stdout.write(spinner);
          if (oldAdminB !== adminB || oldBobB !== bobB)
            process.stdout.write("    --   New Block!");
          return resolve;
        }, 1000);
      });
    })();
    switch (spinner) {
      case ".  ":
        spinner = ".. ";
        break;
      case ".. ":
        spinner = "...";
        break;
      case "...":
        spinner = ".  ";
        break;
    }
    p++;
  }
}

main();
