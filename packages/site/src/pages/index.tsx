import { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SimpleNFT from 'snap/src/contracts/SimpleNFT.json';
import NFTVault from 'snap/src/contracts/NFTVault.json';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
} from '../components';

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
  const [networkId, setNetworkId] = useState<unknown>();

  useEffect(() => {
    const run = async () => {
      setNetworkId(await window.ethereum.request({ method: 'net_version' }));
    }

    const handleChainChanged = async () => {
      setNetworkId(await window.ethereum.request({ method: 'net_version' }));
    }

    window.ethereum.on('chainChanged', handleChainChanged);
    run();
  }, []);

  const simpleNFTContractAddress = networkId ? (SimpleNFT.networks[networkId] ? SimpleNFT.networks[networkId].address : null) : null;
  const simpleNFTInterface = new ethers.utils.Interface(SimpleNFT.abi); 
  const NFTVaultContractAddress = networkId ? (NFTVault.networks[networkId] ? NFTVault.networks[networkId].address : null) : null;
  const NFTVaultInterface = NFTVaultContractAddress ? new ethers.utils.Interface(NFTVault.abi) : null;

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
                  <p><label>NFT Address:</label></p>
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
