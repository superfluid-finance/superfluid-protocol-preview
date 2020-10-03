import React, { useCallback, useEffect, useState } from "react";

import { Web3Provider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";
import AnimatedNumber from "animated-number-react";
import {
  Body,
  Button,
  Header,
  BoxContainer,
  Box,
  ShrinkBox,
  Left,
  Center,
  Right,
  Span,
  BottomTable,
  Div100,
  XL
} from "./components";
import { web3Modal, logoutOfWeb3Modal } from "./utils/web3Modal";

import GET_TRANSFERS from "./graphql/subgraph";
const TruffleContract = require("@truffle/contract");

const APP_ADDRESS = "0x08b8D27547c7c538a9d1fFd1eCE5D8D0E34Bc6Ec"; // previous one, with 5 plyaers in "0x358495191298BC25f5c3bD0f3d64C0CC17aC6f2E";
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
function flowForHumans(flow) {
  return (flow * ((3600 * 24 * 30) / 1e18)).toFixed(2) + " / month";
}
function TableOfPlayers({ playerList, winner }) {
  var items = [];
  console.log("this is playerList");
  console.log(playerList);
  if (playerList.length > 0) {
    console.log("playerList definitely >0");
    var i = 0;
    for (const value of playerList) {
      const { address, flowRate } = value;
      console.log("address: ", address, " netFlow: ", flowRate);
      var item = (
        <li key={i++}>
          {address}{" "}
          {address === winner ? (
            <Span color={"green"}>+{flowForHumans(flowRate)}</Span>
          ) : (
            <Span color={"red"}>-{flowForHumans(flowRate)}</Span>
          )}{" "}
          {address === winner && <XL>👑</XL>}
        </li>
      );
      if (address === winner) items.unshift(item);
      else items.push(item);
    }
  }
  return (
    <BottomTable>
      <h3>Active Players</h3>
      <ul>{items}</ul>
    </BottomTable>
  );
}

function showTick(bool) {
  if (typeof bool === "undefined") return "";
  if (bool) return "✔️";
}

let sf;
let dai;
let daix;
let app;

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, setProvider] = useState();
  const [daiApproved, setDAIapproved] = useState(0);
  const [joinedLottery, setJoinedLottery] = useState();
  const [userAddress, setUserAddress] = useState("");
  const [winnerAddress, setWinnerAddress] = useState("NOBODY");
  const [winnerFlowRate, setWinnerFlowRate] = useState("sticazzi");
  const [daiBalance, setDaiBalance] = useState(0);
  const [daixBalance, setDaixBalance] = useState(0);
  const [daixBalanceFake, setDaixBalanceFake] = useState(0);
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
    await dai
      .approve(
        daix.address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        { from: userAddress }
      )
      .then(async i =>
        setDAIapproved(
          wad4human(await dai.allowance.call(userAddress, app.address))
        )
      );
  }

  async function joinLottery() {
    setDaiBalance(wad4human(await dai.balanceOf.call(userAddress)));
    setDaixBalance(wad4human(await daix.balanceOf.call(userAddress)));
    var call;
    if (daixBalance < 2)
      call = [
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
      ];
    else
      call = [
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
      ];
    console.log("this is the batchcall: ", call);
    await sf.host.batchCall(call, { from: userAddress }).then(async p => {
      setWinnerAddress((await app.currentWinner.call()).player);
    });
  }

  async function leaveLottery() {
    await sf.host
      .callAgreement(
        sf.agreements.cfa.address,
        sf.agreements.cfa.contract.methods
          .deleteFlow(daix.address, userAddress, app.address, "0x")
          .encodeABI(),
        { from: userAddress }
      )
      .then(async p => {
        setWinnerAddress((await app.currentWinner.call()).player);
      });
  }

  const checkWinner = useCallback(async () => {
    await app.currentWinner.call().then(async p => {
      setWinnerAddress(p.player);
      setWinnerFlowRate(
        (await sf.agreements.cfa.getNetFlow.call(
          daix.address,
          winnerAddress
        )).toString()
      );
      setDaixBalance(wad4human(await daix.balanceOf.call(userAddress)));
      setDaixBalanceFake(wad4human(await daix.balanceOf.call(userAddress)));
      setTimeout(function() {
        console.log("checking again, last winner: ", p.player);
        return checkWinner();
      }, 80000);
    });
  }, [userAddress, winnerAddress]);

  /* Open wallet selection modal. */
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();

    sf = new SuperfluidSDK.Framework({
      chainId: 5,
      //version: "master",
      version: "preview-20200928",
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
  function increaseBalance(value) {
    console.log("netflow: ", userNetFlow / 1e18);
    console.log("daixBalanceFake: ", daixBalanceFake);
    setDaixBalanceFake(
      Number(daixBalanceFake) + (Number(userNetFlow) * 5) / 1e18
    );
  }
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
        setDaixBalanceFake(wad4human(await daix.balanceOf.call(userAddress)));
        setDAIapproved(
          wad4human(await dai.allowance.call(userAddress, app.address))
        );
        if (
          (await dai.allowance.call(daix.address, userAddress)).toString() !==
          "0"
        ) {
          setDAIapproved(true);
        }
        const flow = (await sf.agreements.cfa.getNetFlow.call(
          daix.address,
          userAddress
        )).toString();
        console.log("user address: ", userAddress);
        console.log("winner address: ", winnerAddress);
        console.log("Flow in useEffect() = ", flow);
        setUserNetFlow(flow);
        console.log("userNetFlow:", userNetFlow);
        setJoinedLottery(
          (await sf.agreements.cfa.getFlow(
            daix.address,
            userAddress,
            app.address
          )).timestamp > 0
        );
        setWinnerAddress((await app.currentWinner.call()).player);
        var winnerFlow = (await sf.agreements.cfa.getNetFlow.call(
          daix.address,
          winnerAddress
        )).toString();
        setWinnerFlowRate(winnerFlow);
        var newList = getLatestFlows(
          await sf.agreements.cfa.getPastEvents("FlowUpdated", {
            fromBlock: 0,
            filter: {
              receiver: app.address
            }
          })
        ).map(f => {
          var flowRate =
            f.args.sender === winnerAddress
              ? winnerFlow
              : f.args.flowRate.toString();
          console.log("flowrate in mapping ", flowRate);
          return {
            address: f.args.sender,
            flowRate
          };
        });
        console.log(newList);
        setPlayerList(newList);
        checkWinner();
      }
    })();
  }, [
    provider,
    userAddress,
    winnerAddress,
    userNetFlow,
    winnerFlowRate,
    checkWinner
  ]);

  return (
    <Body>
      <div>
        <Header>
          <Div100>
            <h2>Glow lottery, built on Superfluid Flows!</h2>
          </Div100>
          <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} />
        </Header>
        {/*<Image src={logo} alt="react-logo" />*/}
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        <BoxContainer
          winner={
            !joinedLottery
              ? "notPlaying"
              : winnerAddress === userAddress
              ? "winner"
              : "loser"
          }
        >
          <Box>
            <div>
              <p> Your DAI balance: {daiBalance}</p>
              <p>
                {" "}
                Your DAIx balance:
                <AnimatedNumber
                  value={daixBalanceFake}
                  complete={increaseBalance}
                  duration={5000}
                />
              </p>
              <p>
                {" "}
                Your net flow:{" "}
                <Span color={userNetFlow > 0 ? "green" : "red"}>
                  {flowForHumans(userNetFlow)}
                </Span>
              </p>
              {!joinedLottery ? (
                <h1>Join the game!</h1>
              ) : winnerAddress === userAddress ? (
                <h1>You're winning!</h1>
              ) : (
                <h1>You're losing!</h1>
              )}
            </div>
          </Box>
          <Box></Box>
          <ShrinkBox>
            <Button onClick={() => mintDAI()}>
              1. Mint some DAI {showTick(daiBalance !== 0)}
            </Button>
            <Button onClick={() => approveDAI()}>
              2. Approve DAI {showTick(daiApproved !== 0)}
            </Button>
            <Button onClick={() => joinLottery()} disabled={joinedLottery}>
              3. Join Lottery
            </Button>
            <Button onClick={() => leaveLottery()} disabled={!joinedLottery}>
              4. Leave Lottery
            </Button>
          </ShrinkBox>
        </BoxContainer>
        <TableOfPlayers playerList={playerList} winner={winnerAddress} />
        <Div100>
          <Center>
            <h4>
              New winner every time a players joins or leaves.
              <br />
              Stay in the game for a chance to win!
              <br />
            </h4>
          </Center>
        </Div100>
      </div>
    </Body>
  );
}

export default App;
