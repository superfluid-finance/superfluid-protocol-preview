import React, { useCallback, useEffect, useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { Web3Provider, getDefaultProvider } from "@ethersproject/providers";
import { useQuery } from "@apollo/react-hooks";

import { Body, Button, Header, Image, Link } from "./components";
import { web3Modal, logoutOfWeb3Modal } from "./utils/web3Modal";
import logo from "./logo.jpeg";

import { addresses, abis } from "@project/contracts";
import GET_TRANSFERS from "./graphql/subgraph";

async function readOnChainData() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
  // Create an instance of an ethers.js Contract
  // Read more about ethers.js on https://docs.ethers.io/v5/api/contract/contract/
  const ceaErc20 = new Contract(
    addresses.ceaErc20,
    abis.erc20,
    defaultProvider
  );
  // A pre-defined address that owns some CEAERC20 tokens
  const tokenBalance = await ceaErc20.balanceOf(
    "0x3f8CB69d9c0ED01923F11c829BaE4D9a4CB6c82C"
  );
  console.log({ tokenBalance: tokenBalance.toString() });
}

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
  for (const [index, value] of [playerList].entries()) {
    const { address, netFlow } = value;
    items.push(
      <li key={index}>
        {address} {address === winner ? "👑" : ""} ~~~ {netFlow}
      </li>
    );
  }

  return <ul>{items}</ul>;
}

function showTick(bool) {
  if (bool) return "✔️";
  else return "❌";
}

function App() {
  const { loading, error, data } = useQuery(GET_TRANSFERS);
  const [provider, setProvider] = useState();
  const [amount, setAmount] = useState(100);
  const [DAIminted, setDAIminted] = useState(false);
  const [DAIapproved, setDAIapproved] = useState(false);
  const [joinedLottery, setJoinedLottery] = useState(false);
  const [userAddress, setUserAddress] = useState("0x0");
  const [winnerAddress, setWinnerAddress] = useState("0x1");
  const [userBalance, setUserBalance] = useState(0);
  const [userNetFlow, setUserNetFlow] = useState(0);
  const [playerList, setPlayerList] = useState([]);

  function addPlayer({ player }) {
    setPlayerList([...playerList, player]);
  }

  async function mintDAI(amount = 100) {
    //mint some dai here!  100 default amount
    setDAIminted(true);
  }

  async function approveDAI() {
    //approve unlimited please
    setDAIapproved(true);
  }

  async function joinLottery(amount = 100) {
    // upgrade DAI to DAIx, default amount 100
    setJoinedLottery(true);
  }
  async function leaveLottery() {
    // upgrade DAI to DAIx, default amount 100
    setJoinedLottery(false);
  }
  /* Open wallet selection modal. */
  const loadWeb3Modal = useCallback(async () => {
    const newProvider = await web3Modal.connect();
    setProvider(new Web3Provider(newProvider));
  }, []);

  /* If user has loaded a wallet before, load it automatically. */
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
    // ############################ here you do all the data retrieval: please pull all the current players in the lottery and push them using addPlayer({address, netFlow})
  }, [loadWeb3Modal]);

  React.useEffect(() => {
    if (!loading && !error && data && data.transfers) {
      console.log({ transfers: data.transfers });
    }
  }, [loading, error, data]);

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} />
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <p>A simple lottery app, built on Superfluid streams!</p>
        {/* Remove the "hidden" prop and open the JavaScript console in the browser to see what this function does */}
        <Button onClick={() => mintDAI()}>
          Mint some DAI {showTick(DAIminted)}
        </Button>
        <Button onClick={() => approveDAI()}>
          Approve DAI {showTick(DAIapproved)}
        </Button>
        <Button onClick={() => joinLottery()}>
          Join Lottery {showTick(joinedLottery)}
        </Button>
        <Button onClick={() => leaveLottery()}>
          leaveLottery Lottery {showTick(!joinedLottery)}
        </Button>
        <div>
          <p> Your balance: {userBalance}</p>
          <p> Your netFlow: {userNetFlow}</p>
        </div>
        <div>
          <TableOfPlayers playerList={playerList} winner={winnerAddress} />
        </div>
      </Body>
    </div>
  );
}

export default App;
