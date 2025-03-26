import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "./redux/blockchain/blockchainActions";
import { initializeContract, fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles"; // Global styled components
import styled, { createGlobalStyle } from "styled-components";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import Leaderboard from "./components/Leaderboard";
import debounce from "lodash.debounce";

// Images
import defaultImage from "./assets/images/JOINTPACK.jpg";
import passTheJointImage from "./assets/images/PassTheJoint.gif";
import paintswapImage from "./assets/images/paintswap.png";
import telegramImage from "./assets/images/telegram.png";
import twitterImage from "./assets/images/x.png";
import bgImage from "./assets/images/bg.png";

// Utility function
const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input;

// Global Style for consistent box sizing
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
`;

/* ------------------ Styled Components ------------------ */

// Header styles
const Header = styled.header`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #121212;
  padding: 10px 20px;
  z-index: 999;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SocialIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  img {
    width: clamp(30px, 5vw, 40px);
    height: auto;
    transition: transform 0.3s ease;
  }
  img:hover {
    transform: scale(1.1);
  }
`;

// Main action buttons container
const MainActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 20px 0 10px 0;
`;

// Styled button components
const StyledButton = styled.button`
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: rgb(255, 255, 255);
  font-weight: bold;
  color: #0059d7;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 16px;
  &:hover {
    background-color: #21a1f1;
  }
`;

const ConnectWalletButton = styled.button`
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: #0059d7;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-right: 20px;
  :hover {
    background-color: #007bff;
  }
`;

const OpenJOINTPACKS = styled.button`
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: #0059d7;
  font-weight: bold;
  color: white;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s ease;
  :hover {
    background-color: #007bff;
  }
`;

// Main content container
const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const ContentWrapper = styled.div`
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 0 10px;
`;

const NFTGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  column-gap: 5px;
  row-gap: 20px;
  justify-items: center;
  margin-bottom: 20px;
  padding: 20px;
  max-width: 100%;
  width: 100%;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    column-gap: 10px;
    row-gap: 20px;
  }
`;

const NFTBox = styled.div`
  width: 220px;
  min-height: 300px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 768px) {
    width: 150px;
    min-height: 200px;
  }
`;

const NFTImage = styled.img`
  width: 100%;
  max-height: 70%;
  object-fit: cover;
  border-radius: 4px;
  @media (max-width: 768px) {
    max-height: 60%;
  }
`;

const NFTText = styled(s.TextDescription)`
  text-align: center;
  display: block;
  width: 100%;
  margin-top: 10px;
  font-weight: bold;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const NFTButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 5px;
  @media (max-width: 768px) {
    margin-top: 3px;
  }
`;

// Stats container with a gradient background
const StatsContainer = styled.div`
  background: linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 100%);
  padding: 1px 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 600px;
  margin: 30px auto;
`;

const HighlightText = styled.span`
  color: #f1c40f;
  font-weight: bold;
`;

/* ------------------ Inner App Component ------------------ */

function InnerApp() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const location = useLocation(); // Get the current route

  const [selectedToken, setSelectedToken] = useState(null);
  const [rewardMessage, setRewardMessage] = useState("");
  const [totalRewards, setTotalRewards] = useState("0");
  const [userRanking, setUserRanking] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: { NAME: "", SYMBOL: "", ID: 0 },
    NFT_NAME: "",
    SYMBOL: "",
    SHOW_BACKGROUND: true,
    GAS_LIMIT: 3000000,
  });

  const debouncedFetchRef = useRef(null);

  // Compute total rewards for the connected user
  useEffect(() => {
    debouncedFetchRef.current = debounce(async (account) => {
      if (!blockchain.LootBoxNFT || !account) {
        console.error("LootBoxNFT contract is not initialized or account is missing.");
        return;
      }
      try {
        const events = await blockchain.LootBoxNFT.getPastEvents("RewardClaimed", {
          filter: { user: account },
          fromBlock: 0,
          toBlock: "latest",
        });
        const total = events.reduce(
          (sum, event) =>
            sum + parseFloat(blockchain.web3.utils.fromWei(event.returnValues.amount, "ether")),
          0
        );
        setTotalRewards(
          total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
      } catch (error) {
        console.error("Error fetching total rewards:", error);
      }
    }, 300);

    return () => {
      if (debouncedFetchRef.current) {
        debouncedFetchRef.current.cancel();
      }
    };
  }, [blockchain.LootBoxNFT, blockchain.web3]);

  // Compute user's ranking by fetching all RewardClaimed events
  useEffect(() => {
    async function computeRanking() {
      if (!blockchain.LootBoxNFT || !blockchain.web3 || !blockchain.account) return;
      try {
        const events = await blockchain.LootBoxNFT.getPastEvents("RewardClaimed", {
          fromBlock: 0,
          toBlock: "latest",
        });
        const rewards = events.reduce((acc, event) => {
          const user = event.returnValues.user;
          const amount = parseFloat(
            blockchain.web3.utils.fromWei(event.returnValues.amount, "ether")
          );
          acc[user] = (acc[user] || 0) + amount;
          return acc;
        }, {});
        const leaderboardData = Object.keys(rewards).map((user) => ({
          user,
          total: rewards[user],
        }));
        leaderboardData.sort((a, b) => b.total - a.total);
        const rank = leaderboardData.findIndex(
          (item) =>
            item.user.toLowerCase() === blockchain.account.toLowerCase()
        );
        setUserRanking(rank >= 0 ? rank + 1 : null);
      } catch (error) {
        console.error("Error computing user ranking:", error);
      }
    }
    computeRanking();
  }, [blockchain.LootBoxNFT, blockchain.web3, blockchain.account]);

  const fetchTotalRewards = useCallback(
    async (account) => {
      if (!blockchain.web3 || !blockchain.web3.utils) {
        console.error("Web3 or Web3 utils is not initialized.");
        return;
      }
      if (debouncedFetchRef.current) {
        debouncedFetchRef.current(account);
      }
    },
    [blockchain.web3]
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configResponse = await fetch("/config/config.json", {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const config = await configResponse.json();
        SET_CONFIG(config);
        setConfigLoaded(true);
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };

    fetchConfig();
  }, []);

  const handleConnectWallet = () => {
    if (!configLoaded || !CONFIG.CONTRACT_ADDRESS) {
      console.error("Config not loaded or missing contract address.");
      return;
    }
    dispatch(connect(CONFIG));
  };

  useEffect(() => {
    if (blockchain.account && blockchain.web3 && CONFIG.CONTRACT_ADDRESS) {
      try {
        dispatch(initializeContract(CONFIG.CONTRACT_ADDRESS));
        fetchTotalRewards(blockchain.account);
      } catch (error) {
        console.error("Error initializing LootBoxNFT contract:", error);
      }
    }
  }, [blockchain.account, blockchain.web3, CONFIG.CONTRACT_ADDRESS, dispatch, fetchTotalRewards]);

  useEffect(() => {
    if (!blockchain.account || !blockchain.LootBoxNFT) return;
    fetchTotalRewards(blockchain.account);
    dispatch(fetchData());
  }, [blockchain.account, blockchain.LootBoxNFT, dispatch, fetchTotalRewards]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        dispatch({ type: "UPDATE_ACCOUNT", payload: { account: accounts[0] } });
        if (CONFIG.CONTRACT_ADDRESS) {
          dispatch(initializeContract(CONFIG.CONTRACT_ADDRESS));
          fetchTotalRewards(accounts[0]);
          dispatch(fetchData());
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [dispatch, CONFIG.CONTRACT_ADDRESS, fetchTotalRewards]);

  const pollForRewardClaimed = async (tokenId, fromBlock) => {
    const pollInterval = 2000;
    const pollTimeout = 60000;
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const events = await blockchain.LootBoxNFT.getPastEvents("RewardClaimed", {
          filter: { user: blockchain.account, tokenId },
          fromBlock,
          toBlock: "latest",
        });

        if (events.length > 0) {
          const { amount } = events[0].returnValues;
          setRewardMessage(
            `YOU HAVE RECEIVED ${parseFloat(
              blockchain.web3.utils.fromWei(amount, "ether")
            ).toLocaleString()} $MIKUL FROM PACK #${tokenId}.`
          );
          dispatch(fetchData());
          fetchTotalRewards(blockchain.account);
          clearInterval(interval);
        } else if (Date.now() - startTime >= pollTimeout) {
          setRewardMessage("Reward not received. Check later.");
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling for RewardClaimed event:", error);
        setRewardMessage("Error fetching reward. Check later.");
        clearInterval(interval);
      }
    }, pollInterval);
  };

  const openLootBox = async (tokenId) => {
    try {
      setRewardMessage(`OPENING $MIKUL PACK #${tokenId}...`);
      const tx = await blockchain.LootBoxNFT.methods
        .openLootBox(tokenId)
        .send({ from: blockchain.account, gas: CONFIG.GAS_LIMIT });

      console.log("Transaction Receipt:", tx);
      let fromBlock;
      if (tx.blockNumber) {
        fromBlock = tx.blockNumber;
      } else {
        const txReceipt = await blockchain.web3.eth.getTransactionReceipt(tx.transactionHash);
        fromBlock = txReceipt.blockNumber;
      }
      setRewardMessage(`$MIKUL PACK #${tokenId} OPENED SUCCESSFULLY. WAITING FOR REWARD....`);
      pollForRewardClaimed(tokenId, fromBlock);
    } catch (error) {
      console.error("Error opening lootbox:", error);
      setRewardMessage("FAILED TO OPEN $MIKULPACK. CONTACT $MIKUL");
    }
  };

  return (
    <>
      <GlobalStyle />
      <s.Screen image={bgImage}>
        <Header>
          <HeaderWrapper>
            <SocialIcons>
              <a
                href="https://paintswap.io/sonic/collections/0x9a303054c302b180772a96caded9858c7ab92e99/listings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={paintswapImage} alt="PaintSwap" />
              </a>
              <a href="https://x.com/PassThe_JOINT" target="_blank" rel="noopener noreferrer">
                <img src={twitterImage} alt="Twitter" />
              </a>
              <a href="https://t.me/jointonsonic" target="_blank" rel="noopener noreferrer">
                <img src={telegramImage} alt="Telegram" />
              </a>
              <a href="https://passthejoint.netlify.app/" target="_blank" rel="noopener noreferrer">
                <img src={passTheJointImage} alt="Pass the $MIKUL" />
              </a>
            </SocialIcons>
            <ConnectWalletButton onClick={handleConnectWallet} disabled={!configLoaded}>
              {blockchain.account ? `CONNECTED: ${truncate(blockchain.account, 15)}` : "CONNECT WALLET"}
            </ConnectWalletButton>
          </HeaderWrapper>
        </Header>

        <MainActions>
          {/* Conditionally render top buttons based on route */}
          {location.pathname === "/" && (
            <Link to="/leaderboard">
              <StyledButton>LEADERBOARD</StyledButton>
            </Link>
          )}
          {location.pathname === "/leaderboard" && (
            <Link to="/">
              <StyledButton>OPEN $MIKUL PACKS</StyledButton>
            </Link>
          )}
          {/* Always visible */}
          <a
            href="https://paintswap.io/sonic/collections/0xe359c086ff6ebac406a77063ef4c47a6565d3a05/listings"
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledButton>GET MORE $MIKUL PACKS</StyledButton>
          </a>
        </MainActions>

        <MainContent>
          <ContentWrapper>
            <Routes>
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route
                path="/"
                element={
                  <>
                    {blockchain.errorMsg !== "" && (
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          fontSize: 20,
                          color: "white",
                          marginBottom: "20px",
                        }}
                      >
                        {blockchain.errorMsg}
                      </s.TextDescription>
                    )}
                    {blockchain.account && blockchain.LootBoxNFT ? (
                      <>
                        {/* Stats Section with User Ranking */}
             {/* Stats Section with User Ranking */}
<StatsContainer>
  <s.TextTitle
    style={{
      fontSize: "32px",
      marginBottom: "0px",
      color: "white",
    }}
  >
    YOUR $MIKUL PACKS
  </s.TextTitle>
  <s.TextSubTitle
    style={{
      fontSize: "20px",
      marginBottom: "10px",
      color: "white",
    }}
  >
    OPEN TO RECEIVE 10,000 TO 420,000 $MIKUL
  </s.TextSubTitle>
  <s.TextSubTitle
    style={{
      fontSize: "20px",
      marginBottom: "10px",
      color: "white",
    }}
  >
    PACKS CONTAIN ON AVERAGE 42,000 $MIKUL
  </s.TextSubTitle>
  <s.TextDescription
    style={{
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "white",
    }}
  >
    TOTAL $MIKUL RECEIVED: <HighlightText>{totalRewards} $MIKUL</HighlightText>
  </s.TextDescription>
  {blockchain.account && (
    <>
      {userRanking !== null ? (
        userRanking <= 100 ? (
          <s.TextDescription
            style={{
              fontSize: "20px",
              color: "white",
              marginBottom: "20px",
            }}
          >
            Your Leaderboard Ranking: <HighlightText>#{userRanking}</HighlightText>
          </s.TextDescription>
        ) : (
          <s.TextDescription
            style={{
              fontSize: "20px",
              color: "white",
              marginBottom: "20px",
            }}
          >
            Your Leaderboard Ranking: <HighlightText>#{userRanking}</HighlightText> (Not in Top 100)
          </s.TextDescription>
        )
      ) : (
        <s.TextDescription
          style={{
            fontSize: "20px",
            color: "white",
            marginBottom: "20px",
          }}
        >
          Your wallet is not in the Top 100.
        </s.TextDescription>
      )}
    </>
  )}
</StatsContainer>

                        {rewardMessage && (
                          <s.TextDescription
                            style={{
                              textAlign: "center",
                              fontSize: 20,
                              fontWeight: "bold",
                              color: "white",
                              marginTop: "20px",
                              backgroundColor: "rgba(0, 0, 0, 0.5)", // Add background color
                              padding: "10px", // Optional: Add padding for better appearance
                              borderRadius: "5px" 
                            }}
                          >
                            {rewardMessage}
                          </s.TextDescription>
                        )}

                        {data.nfts && data.nfts.length > 0 ? (
                          <NFTGrid>
                            {data.nfts.map(({ tokenId, image }) => (
                              <NFTBox key={tokenId}>
                                <NFTImage
                                  src={image || defaultImage}
                                  alt={`LootBox ${tokenId}`}
                                  selected={selectedToken === tokenId}
                                  onClick={() => setSelectedToken(tokenId)}
                                />
                                <NFTText>{`$MIKUL PACK #${tokenId}`}</NFTText>
                                <NFTButtonContainer>
                                  <OpenJOINTPACKS onClick={() => openLootBox(tokenId)}>
                                    OPEN $MIKUL PACK
                                  </OpenJOINTPACKS>
                                </NFTButtonContainer>
                              </NFTBox>
                            ))}
                          </NFTGrid>
                        ) : (
                          <StatsContainer>
                            <s.TextDescription
                              style={{
                                fontSize: "20px",
                                color: "white",
                                marginBottom: "20px",
                              }}
                            >
                              NO $MIKUL PACKS FOUND. DON'T STOP THE PARTY!
                            </s.TextDescription>
                            <a
                              href="https://paintswap.io/sonic/collections/0xe359c086ff6ebac406a77063ef4c47a6565d3a05/listings"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OpenJOINTPACKS>GET MORE $MIKUL PACKS</OpenJOINTPACKS>
                            </a>
                          </StatsContainer>
                        )}
                      </>
                    ) : (
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          fontSize: 20,
                          color: "black",
                          marginTop: "60px",
                        }}
                      >
                        PLEASE CONNECT YOUR WALLET TO VIEW YOUR $MIKUL PACKS.
                      </s.TextDescription>
                    )}
                  </>
                }
              />
            </Routes>
          </ContentWrapper>
        </MainContent>
      </s.Screen>
    </>
  );
}

/* ------------------ Outer App Component ------------------ */
function App() {
  return (
    <Router>
      <InnerApp />
    </Router>
  );
}

export default App;
