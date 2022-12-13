import { useContext, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  sendHello,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  SendHelloButton,
  Card,
} from '../components';
import { ethers } from 'ethers';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [simpleNFTContractAddress, setSimpleNFTContractAddress] = useState(); 
  const [NFTVaultContractAddress, setNFTVaultContractAddress] = useState(); 

  const simpleNFTABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"NFTMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_tokenURI","type":"string"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"}]; 
  const simpleNFTInterface = new ethers.utils.Interface(simpleNFTABI); 

  const NFTVaultABI = [{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"secondSigner","type":"address"}],"name":"depositNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"withdrawNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approveWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproval","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"removeApproval","outputs":[],"stateMutability":"nonpayable","type":"function"}]; 
  const NFTVaultInterface = new ethers.utils.Interface(NFTVaultABI); 

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendHelloClick = async () => {
    try {
      await sendHello();
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const saveContractAddresses = async (e:Event) => { 
    e.preventDefault(); 
    const data = new FormData(e.target); 
    const simpleNFTaddress = data.get("simpleNFTaddress"); 
    const NFTvaultaddress = data.get("NFTvaultaddress"); 
    setSimpleNFTContractAddress(simpleNFTaddress); 
    setNFTVaultContractAddress(NFTvaultaddress); 
    alert("Set addresses to: "+simpleNFTaddress+" and "+NFTvaultaddress); 
  }; 

  const mintNFTHandler = async (e:Event) => { 
    e.preventDefault();
    const data = new FormData(e.target);  
    const tokenURI = ""+data.get("mintNFTtokenURI");
    const functionData = simpleNFTInterface.encodeFunctionData('mint',[tokenURI]); 
    // Get the user's account from MetaMask.
    try { 
      const [from] = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      // Send a transaction to MetaMask.
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: from,
            to: simpleNFTContractAddress,
            value: '0x0',
            data: functionData,
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }; 

  const approveVaultHandler = async (e:Event) => {
    e.preventDefault();
    const data = new FormData(e.target);  
    const address = ""+data.get("contractAddressToApprove"); 
    const tokenId = parseInt(data.get("tokenIdToApprove")); 
    const functionData = simpleNFTInterface.encodeFunctionData('approve',[NFTVaultContractAddress,tokenId]); 
    try { 
      const [from] = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      // Send a transaction to MetaMask.
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: from,
            to: address,
            value: '0x0',
            data: functionData,
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }; 

  const depositToVaultHandler = async (e:Event) => {
    e.preventDefault();
    const data = new FormData(e.target);  
    const nftAddress = ""+data.get("nftAddressToDeposit"); 
    const tokenId = parseInt(data.get("nftTokenIdToDeposit")); 
    const secondSigner = ""+data.get("secondSigner"); 
    const functionData = NFTVaultInterface.encodeFunctionData('depositNFT',[nftAddress, tokenId, secondSigner]); 
    try { 
      const [from] = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      // Send a transaction to MetaMask.
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: from,
            to: NFTVaultContractAddress,
            value: '0x0',
            data: functionData,
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }; 

  const approveWithdrawHandler = async (e:Event) => {
    e.preventDefault();
    const data = new FormData(e.target);  
    const nftAddress = ""+data.get("nftAddressToApprove"); 
    const tokenId = parseInt(data.get("nftTokenIdToApprove")); 
    const functionData = NFTVaultInterface.encodeFunctionData('approveWithdraw',[nftAddress, tokenId]); 
    try { 
      const [from] = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      // Send a transaction to MetaMask.
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: from,
            to: NFTVaultContractAddress,
            value: '0x0',
            data: functionData,
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }; 
  
  const withdrawHandler = async (e:Event) => {
    e.preventDefault();
    const data = new FormData(e.target);  
    const nftAddress = ""+data.get("nftAddressToWithdraw"); 
    const tokenId = parseInt(data.get("nftTokenIdToWithdraw")); 
    const functionData = NFTVaultInterface.encodeFunctionData('withdrawNFT',[nftAddress, tokenId]); 
    try { 
      const [from] = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      // Send a transaction to MetaMask.
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: from,
            to: NFTVaultContractAddress,
            value: '0x0',
            data: functionData,
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  }; 

  return (
    <Container>
      <Heading>
        Welcome to <Span>template-snap</Span>
      </Heading>
      <Subtitle>
        Get started by editing <code>src/index.ts</code>
      </Subtitle>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.isFlask}
                />
              ),
            }}
            disabled={!state.isFlask}
          />
        )}
        {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={handleConnectClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Send Hello message',
            description:
              'Display a custom message within a confirmation screen in MetaMask.',
            button: (
              <SendHelloButton
                onClick={handleSendHelloClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
        <Card 
          content={{
            title: 'Set Contract Addresses', 
            description: (
              <form id="setAddresses" onSubmit={saveContractAddresses}>
                <p><label>SimpleNFT.sol address:</label></p>
                <p><input type="text" name="simpleNFTaddress" /></p>
                <p><label>NFTVault.sol address:</label></p>
                <p><input type="text" name="NFTvaultaddress" /></p>
                <button type="submit">Save</button>
              </form>
            ), 
          }}
        />
        {simpleNFTContractAddress && ( 
          <Card
            content={{
              title: 'Mint an NFT',
              description: (
                <form id="mintNFT" onSubmit={mintNFTHandler}>
                  <p><label>TokenURI:</label></p>
                  <p><input type="text" name="mintNFTtokenURI" id="mintNFTtokenURI" /></p>
                  <button type="submit">Mint</button>
                </form>
              ), 
            }}
            disabled={false}
            fullWidth={false}
          />
        )}
        {NFTVaultContractAddress && (
          <Card
            content={{
              title: 'Approve the NFT Vault to hold your NFT',
              description: (
                <form id="approveVault" onSubmit={approveVaultHandler}>
                  <p><label>NFT Contract Address:</label></p>
                  <p><input type="text" name="contractAddressToApprove" id="contractAddressToApprove" /></p>
                  <p><label>NFT token ID:</label></p>
                  <p><input type="text" name="tokenIdToApprove" id="tokenIdToApprove" /></p>
                  <button type="submit">Approve</button>
                </form>
              ), 
            }}
            disabled={false}
            fullWidth={false}
          />
        )}
        {NFTVaultContractAddress && (
          <Card
            content={{
              title: 'Deposit an NFT into the vault',
              description: (
                <form id="depositToVault" onSubmit={depositToVaultHandler}>
                  <p><em>Make sure you have approved the vault to hold this NFT!</em></p>
                  <p><label>NFT Contract Address:</label></p>
                  <p><input type="text" name="nftAddressToDeposit" id="nftAddressToDeposit" /></p>
                  <p><label>NFT token ID:</label></p>
                  <p><input type="text" name="nftTokenIdToDeposit" id="nftTokenIdToDeposit" /></p>
                  <p><label>Second signer for withdraw approval:</label></p>
                  <p><input type="text" name="secondSigner" id="secondSigner" /></p>
                  <button type="submit">Deposit</button>
                </form>
              ), 
            }}
            disabled={false}
            fullWidth={false}
          />
        )}
        {NFTVaultContractAddress && (
          <Card
            content={{
              title: 'Approve an NFT to be withdrawn',
              description: (
                <form id="approveWithdraw" onSubmit={approveWithdrawHandler}>
                  <p><em>Make sure you are calling this from the second signer!</em></p>
                  <p><label>NFT Contract Address:</label></p>
                  <p><input type="text" name="nftAddressToApprove" id="nftAddressToApprove" /></p>
                  <p><label>NFT token ID:</label></p>
                  <p><input type="text" name="nftTokenIdToApprove" id="nftTokenIdToApprove" /></p>
                  <button type="submit">Approve Withdrawal</button>
                </form>
              ), 
            }}
            disabled={false}
            fullWidth={false}
          />
        )}
        {NFTVaultContractAddress && (
          <Card
            content={{
              title: 'Withdraw NFT',
              description: (
                <form id="withdraw" onSubmit={withdrawHandler}>
                  <p><em>Make sure the second signer has already approved this!</em></p>
                  <p><label>NFT Contract Address:</label></p>
                  <p><input type="text" name="nftAddressToWithdraw" id="nftAddressToWithdraw" /></p>
                  <p><label>NFT token ID:</label></p>
                  <p><input type="text" name="nftTokenIdToWithdraw" id="nftTokenIdToWithdraw" /></p>
                  <button type="submit">Withdraw</button>
                </form>
              ), 
            }}
            disabled={false}
            fullWidth={false}
          />
        )}
        <Notice>
          <p>
            Please note that the <b>snap.manifest.json</b> and{' '}
            <b>package.json</b> must be located in the server root directory and
            the bundle must be hosted at the location specified by the location
            field.
          </p>
        </Notice>
      </CardContainer>
    </Container>
  );
};

export default Index;
