# Unleashed mm-snap tutorial

This project starts from the [4byte API snap](https://github.com/Montoya/tx-insights-with-4byte-snap) plus the 2 contracts `SimpleNFT.sol` and `NFTVault.sol`. The following is a tutorial. Run `yarn install && yarn start` in the main directory to get the development environment started, then follow these steps: 

1. In `packages/site/src/components/Card.tsx`, change line 7 to `description: string | ReactNode;`. This will allow for using HTML in card descriptions. 
2. In the same file, change line 8 to `button?: ReactNode;`. This will make the button prop optional. 
3. In the same file, change line 43 to `const Description = styled.div`. This will make it possible to put any kind of HTML inside of description. 
4. In `packages/site/src/pages/index.tsx`, delete the last two cards. 
5. Now add a card and function to store the addresses of the two smart contracts `SimpleNFT.sol` and `NFTVault.sol`. 
    1. Update the first import to include `useState` from `React`. 
    2. In the `Index` function, add: 
    ```
    const [simpleNFTContractAddress, setSimpleNFTContractAddress] = useState(); 
    const [NFTVaultContractAddress, setNFTVaultContractAddress] = useState(); 
    ```
    3. Further down in the same function, add: 
    ```
    const saveContractAddresses = async (e:Event) => { 
      e.preventDefault(); 
      const data = new FormData(e.target); 
      const simpleNFTaddress = data.get("simpleNFTaddress"); 
      const NFTvaultaddress = data.get("NFTvaultaddress"); 
      setSimpleNFTContractAddress(simpleNFTaddress); 
      setNFTVaultContractAddress(NFTvaultaddress); 
      alert("Set addresses to: "+simpleNFTaddress+" and "+NFTvaultaddress); 
    }; 
    ```
    4. And towards the bottom, add this card: 
    ```
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
    ```
6. Open another terminal, go to the truffle package directory, and run `yarn run deploy`. This will execute a deployment of the two contracts with truffle. You should see the addresses where the contracts are deployed in the output (and also in the terminal where the site, snap, and truffle are all running). Remember these addresses so you can set them in the site with the form you just created. 
7. Now add a card and function to mint NFTs using the `SimpleNFT.sol` contract. 
    1. Towards the bottom, add this card: 
    ```
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
    ```
      By wrapping it in this conditional render, it will only appear when `simpleNFTContractAddress` has been set!
    
    2. We are going to need a way to encode the method and parameters when calling these functions, so stop the packages and add the `web3-eth-abi` package to this project in `packages/site`: `yarn add web3-eth-abi`, then import it into this file: `import Web3EthAbi from 'web3-eth-abi';`. 
    3. Unfortunately this introduces an issue with a missing polyfill, so we have to take a detour and resolve it. Run `yarn add --dev react-app-rewired process crypto-browserify stream-browserify assert stream-http https-browserify os-browserify url buffer`, `npm i -S webpack`, and then add a file `gatsby-node.js` with the following: 
    ```
    const webpack = require("webpack");

    module.exports.onCreateWebpackConfig = ({ actions }) => {
        actions.setWebpackConfig({
            plugins: [
                new webpack.ProvidePlugin({
                    Buffer: [require.resolve("buffer/"), "Buffer"],
                }),
            ],
            resolve: {
                fallback: {
                    crypto: require.resolve('crypto-browserify'),
                    stream: require.resolve('stream-browserify'), 
                    assert: require.resolve('assert'), 
                    http: require.resolve('stream-http'), 
                    https: require.resolve('https-browserify'), 
                    os: require.resolve('os-browserify'),
                    url: require.resolve('url'), 
                },
            }
        })
    };
    ```
    Go back up to the main directory and update `eslintrc.js` with the following rule: 
    ```
    rules: {
      "node/no-unpublished-require": ["error", {
        "allowModules": ["buffer","crypto-browserify","stream-browserify","stream-http","https-browserify","os-browserify"]
      }]
    },
    ```
    Now, start the packages again with `yarn start`. 
    
    4. Now add the following function: 
    ```
    const mintNFTHandler = async (e:Event) => { 
      e.preventDefault();
      const data = new FormData(e.target);  
      const tokenURI = ""+data.get("mintNFTtokenURI"); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'mint', 
        type: 'function', 
        inputs: [{
          type: 'string', 
          name: '_tokenURI'
        }]
      }, [tokenURI]); 
      try { 
        await sendContractTransaction(
          simpleNFTContractAddress, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 
    ```
    This takes the tokenURI from the form, encodes a function call for the `mint` method with the tokenURI as a parameter, and then makes a call to MetaMask to send the contract transaction. 
8. Now it's finally time to mint an NFT! Try minting with this `tokenURI`: `https://www.rd.com/wp-content/uploads/2020/12/GettyImages-78777891-scaled.jpg`. 
9. Next, the NFT Vault needs to be approved to transfer this NFT on your behalf. 
    1. Add the following card: 
    ```
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
    ```
    2. Add the following function, which tells the NFT contract to approve the vault contract to be able to transfer this token ID: 
    ```
    const approveVaultHandler = async (e:Event) => {
      e.preventDefault();
      const data = new FormData(e.target);  
      const address = ""+data.get("contractAddressToApprove"); 
      const tokenId = parseInt(data.get("tokenIdToApprove")); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'approve', 
        type: 'function', 
        inputs: [{
          type: 'address', 
          name: 'to'
        },{
          type: 'uint256',
          name: 'tokenId'
        }]
      }, [NFTVaultContractAddress, tokenId]); 
      try { 
        await sendContractTransaction(
          address, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 
    ```
10. Since you added already minted the NFT (and if it is the first token minted, then the ID is "1"), you can enter the SimpleNFT contract address and "1" into this form and click Approve. You will see a confirmation from MetaMask asking "Give permission to access your SimpleNFT (#1)?"
11. Now you are ready to add a method to deposit your NFT, but before you do that you need a second address to act as the approver. When you deposit the NFT, you specify this second address as someone authorized to approve the withdrawal; without that approval, the NFT will remain safely "vaulted" and no one can steal it, even if they get access to your account. Normally you would use the address of a real person you know, but since you are testing locally, the easiest way to do this is to add another account in MetaMask Flask. Open the account menu in MetaMask Flask and click "+ Create Account." For the account name, you can put "Approver." 
12. Next, add the deposit functionality: 
    1. Add the following card: 
    ```
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
    ```
    2. Add the following function: 
    ```
    const depositToVaultHandler = async (e:Event) => {
      e.preventDefault();
      const data = new FormData(e.target);  
      const nftAddress = ""+data.get("nftAddressToDeposit"); 
      const tokenId = parseInt(data.get("nftTokenIdToDeposit")); 
      const secondSigner = ""+data.get("secondSigner"); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'depositNFT', 
        type: 'function', 
        inputs: [{
          type: 'address', 
          name: 'nftContract'
        },{
          type: 'uint256', // note that 'uint' does not work!
          name: 'tokenId'
        },{
          type: 'address', 
          name: 'secondSigner'
        }]
      }, [nftAddress, tokenId, secondSigner]); 
      try { 
        await sendContractTransaction(
          NFTVaultContractAddress, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 
    ```
13. Now you can deposit the NFT! Copy the second account you created in MetaMask and paste it into this form, then switch back to the first account before doing the deposit. Put the same NFT contract address and token ID that you just approved in the previous step, then click "Deposit."
14. Next add the code to approve and withdraw NFTs: 
    1. Add these cards: 
    ```
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
    ```
    2. Add these functions: 
    ```
    const approveWithdrawHandler = async (e:Event) => {
      e.preventDefault();
      const data = new FormData(e.target);  
      const nftAddress = ""+data.get("nftAddressToApprove"); 
      const tokenId = parseInt(data.get("nftTokenIdToApprove")); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'approveWithdraw', 
        type: 'function', 
        inputs: [{
          type: 'address', 
          name: 'nftContract'
        },{
          type: 'uint256',
          name: 'tokenId'
        }]
      }, [nftAddress, tokenId]); 
      try { 
        await sendContractTransaction(
          NFTVaultContractAddress, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 

    const withdrawHandler = async (e:Event) => {
      e.preventDefault();
      const data = new FormData(e.target);  
      const nftAddress = ""+data.get("nftAddressToWithdraw"); 
      const tokenId = parseInt(data.get("nftTokenIdToWithdraw")); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'withdrawNFT', 
        type: 'function', 
        inputs: [{
          type: 'address', 
          name: 'nftContract'
        },{
          type: 'uint256',
          name: 'tokenId'
        }]
      }, [nftAddress, tokenId]); 
      try { 
        await sendContractTransaction(
          NFTVaultContractAddress, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 
    ```
15. Now you can swith to the second account, approve the NFT for withdrawal, switch back to the first account, and withdraw it! To confirm that this works, you can try withdrawing an NFT that you didn't already approve -- you will see that it fails. 

Now the dapp is fully functioning. Next, build a snap that can decode these transactions and use the same smart contracts to provide some meaningful information: 

1. 