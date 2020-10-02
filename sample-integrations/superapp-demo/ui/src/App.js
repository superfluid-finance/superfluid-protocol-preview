import React, { useCallback, useEffect, useState } from "react";

import { Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import {
  Body,
  Button,
  Header,
  BoxContainer,
  Box,
  Left,
  Center
} from "./components";
import { web3Modal, logoutOfWeb3Modal } from "./utils/web3Modal";
import logo from "./logo.jpeg";

import GET_TRANSFERS from "./graphql/subgraph";
const TruffleContract = require("@truffle/contract");

const APP_ADDRESS = "0x3bF9DCDD87c31855C901f13AF20B0956140971EF";
const MINIMUM_GAME_FLOW_RATE = "3858024691358";
const LotterySuperApp = TruffleContract(require("./LotterySuperApp.json"));

const { wad4human } = require("@decentral.ee/web3-helpers");

const SuperfluidSDK = require("@superfluid-finance/ethereum-contracts");

function WalletButton({ provider, loadWeb3Modal }) {
  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

function TableOfPlayers({ playerList, winner }) {
  var items = [];
  console.log(playerList);
  if (playerList.length > 1) {
    for (const [index, value] of [playerList].entries()) {
      const { address, netFlow } = value;
      console.log("address: ", address, " netFlow: ", netFlow);
      items.push(
        <li key={index}>
          {address} {address === winner ? "👑" : ""} ~~~{" "}
          {(netFlow * (3600 * 24 * 30)) / 1e18}
        </li>
      );
    }
  }
  return <ul>{items}</ul>;
}

function showTick(bool) {
  if (typeof bool === "undefined") return "";
  if (bool) return "✔️";
  else return "❌";
}

let sf;
let dai;
let daix;
let app;

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, setProvider] = useState();
  const [daiApproved, setDAIapproved] = useState();
  const [joinedLottery, setJoinedLottery] = useState();
  const [userAddress, setUserAddress] = useState("");
  const [winnerAddress, setWinnerAddress] = useState("NOBODY");
  const [daiBalance, setDaiBalance] = useState(0);
  const [daixBalance, setDaixBalance] = useState(0);
  const [userNetFlow, setUserNetFlow] = useState(0);
  const [playerList, setPlayerList] = useState([]);

  async function mintDAI(amount = 100) {
    //mint some dai here!  100 default amount
    await dai.mint(
      userAddress,
      sf.web3.utils.toWei(amount.toString(), "ether"),
      { from: userAddress }
    );
    setDaiBalance(wad4human(await dai.balanceOf.call(userAddress)));
  }

  async function approveDAI() {
    //approve unlimited please
    await dai.approve(
      daix.address,
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      { from: userAddress }
    );
    setDAIapproved(true);
  }

  async function joinLottery() {
    console.log("app", app);
    await sf.host.batchCall(
      [
        [
          2, // upgrade 100 daix to play the game
          daix.address,
          sf.web3.eth.abi.encodeParameters(
            ["uint256"],
            [sf.web3.utils.toWei("100", "ether").toString()]
          )
        ],
        [
          0, // approve the ticket fee
          daix.address,
          sf.web3.eth.abi.encodeParameters(
            ["address", "uint256"],
            [APP_ADDRESS, sf.web3.utils.toWei("1", "ether").toString()]
          )
        ],
        [
          5, // callAppAction to participate
          app.address,
          app.contract.methods.participate("0x").encodeABI()
        ],
        [
          4, // create constant flow (10/mo)
          sf.agreements.cfa.address,
          sf.agreements.cfa.contract.methods
            .createFlow(
              daix.address,
              app.address,
              MINIMUM_GAME_FLOW_RATE.toString(),
              "0x"
            )
            .encodeABI()
        ]
      ],
      { from: userAddress }
    );
  }

  async function leaveLottery() {
    await sf.host.callAgreement(
      sf.agreements.cfa.address,
      sf.agreements.cfa.contract.methods
        .deleteFlow(daix.address, userAddress, app.address, "0x")
        .encodeABI(),
      { from: userAddress }
    );
  }

  /* Open wallet selection modal. */
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();

    sf = new SuperfluidSDK.Framework({
      chainId: 5,
      version: "master",
      web3Provider: newProvider
    });
    await sf.initialize();

    const daiAddress = await sf.resolver.get("tokens.fDAI");
    dai = await sf.contracts.TestToken.at(daiAddress);
    const daixWrapper = await sf.getERC20Wrapper(dai);
    daix = await sf.contracts.ISuperToken.at(daixWrapper.wrapperAddress);
    LotterySuperApp.setProvider(newProvider);
    app = await LotterySuperApp.at(APP_ADDRESS);

    const accounts = await sf.web3.eth.getAccounts();
    setUserAddress(accounts[0]);
    setProvider(new Web3Provider(newProvider));
    global.web3 = sf.web3;
  }, []);

  /* If user has loaded a wallet before, load it automatically. */
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }

    // ############################ here you do all the data retrieval: please pull all the current players in the lottery and push them using addPlayer({address, netFlow})
  }, [loadWeb3Modal]);

  function getLatestFlows(flows) {
    return Object.values(
      flows.reduce((acc, i) => {
        acc[i.args.sender + ":" + i.args.receiver] = i;
        return acc;
      }, {})
    ).filter(i => i.args.flowRate.toString() != "0");
  }
  useEffect(() => {
    (async () => {
      if (provider) {
        setDaiBalance(wad4human(await dai.balanceOf.call(userAddress)));
        setDaixBalance(wad4human(await daix.balanceOf.call(userAddress)));
        if (
          (await dai.allowance.call(daix.address, userAddress)).toString() !==
          "0"
        ) {
          setDAIapproved(true);
        }
        setUserNetFlow(
          ((await sf.agreements.cfa.getNetFlow.call(
            daix.address,
            userAddress
          )).toString() *
            3600 *
            24 *
            30) /
            1e18
        );
        setJoinedLottery(
          (await sf.agreements.cfa.getFlow(
            daix.address,
            userAddress,
            app.address
          )).timestamp > 0
        );
        setWinnerAddress((await app.currentWinner.call()).player);
        getLatestFlows(
          await sf.agreements.cfa.getPastEvents("FlowUpdated", {
            fromBlock: 0,
            filter: {
              receiver: app.address
            }
          })
        ).map(f =>
          setPlayerList({
            address: f.args.sender,
            flowRate: f.args.flowRate.toString() * ((3600 * 24 * 30) / 1e18)
          })
        );
      }
    })();
  }, [provider, userAddress, winnerAddress]);

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} />
        <Left>A simple lottery app, built on Superfluid streams!</Left>
      </Header>
      <Body
        winner={
          !joinedLottery
            ? "notPlaying"
            : winnerAddress === userAddress
            ? "winner"
            : "loser"
        }
      >
        {/*<Image src={logo} alt="react-logo" />*/}
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        <BoxContainer>
          <Box>
            <div>
              <p> Your DAI balance: {daiBalance}</p>
              <p> Your DAIx balance: {daixBalance}</p>
              <p> Your netFlow: {userNetFlow}</p>
              {joinedLottery && winnerAddress === userAddress && (
                <p>YOU're winning!</p>
              )}
            </div>
          </Box>
          <Box>
            <Center>
              {daiBalance === "0" ? (
                <Button onClick={() => mintDAI()}>
                  Mint some DAI {showTick(daiBalance !== "0")}
                </Button>
              ) : (
                <Button onClick={() => approveDAI()}>
                  Approve DAI {showTick(daiApproved)}
                </Button>
              )}
              {joinedLottery === false ? (
                <Button onClick={() => joinLottery()}>Join Lottery</Button>
              ) : (
                <Button onClick={() => leaveLottery()}>Leave Lottery</Button>
              )}
            </Center>
          </Box>
          <Box>
            <div>
              <TableOfPlayers playerList={playerList} winner={winnerAddress} />
            </div>
          </Box>
        </BoxContainer>
      </Body>
    </div>
  );
}

export default App;
