# Unleashed Tutorial

This tutorial assumes a fresh install of the MetaMask Snaps Truffle Box with the NFTVault.sol and SimpleNFT.sol contracts and tests added. Make sure you have followed the steps in the original README and you ran `yarn install && yarn start` to start your development environment. 

To proceed: 

* Deploy the contracts by going to the `packages/truffle` directory and running `yarn run deploy`
* Note the addresses they are deployed at
* Find the `NFTVault.sol` contract ABI in the `build` folder, in the file `NFTVault.json`
* Using the command line, mint a few NFTs using the `SimpleNFT.sol` contract to the address you are using in MetaMask Flask: 
    * `truffle console`
    * `let contract = await SimpleNFT.deployed();`
    * `contract.mint("123");`
* Or, send some ETH to the address you are using in Flask so you can use it later: 
    * `let accounts = await web3.eth.getAccounts();`
    * `web3.eth.sendTransaction({to:"[your account]",from:accounts[0],value:web3.utils.toWei('1',"ether")});`

Now you are ready to build the NFT Vault dapp to use the `NFTVault.sol` contract. 

* Go back to the main directory and navigate to `packages/site`
* We will need to use the `ethers` library to interact with smart contracts and MetaMask, so add it to the project: `yarn add ethers` and then import it at the top of `src/index.tsx`: `import { ethers } from 'ethers';`
* Make sure to go back to stop the running packages and run `yarn install && yarn start`. 
* Go back to `packages/site`. Next we will make the card components more flexible to be able to use forms. Make the following changes: 
    * In `src/components/Card.tsx`, change line 7 to `description: string | ReactNode;`. This will allow for using HTML in card descriptions.
    * In the same file, change line 8 to `button?: ReactNode;`. This will make the button prop optional.
    * In the same file, change line 43 to `const Description = styled.div`\`. This will make it possible to put any kind of HTML inside of description.
* Then make it possible to store the addresses of the `SimpleNFT.sol` and `NFTVault.sol` contracts in the dapp: 
    * In `src/pages/index.tsx`, add `useState` to the import from React like this: `import { useContext, useState } from 'react';`
    * Then add the following lines at the start of the `Index` function: 
    ```
    const [simpleNFTContractAddress, setSimpleNFTContractAddress] = useState(); 
    const [NFTVaultContractAddress, setNFTVaultContractAddress] = useState(); 
    ```
    * Further down in the same function, add: 
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
    * And towards the bottom, add this card: 
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
* You should now see this form appear in the page, and you can use it to store the contract addresses. 
* Now add a form to mint an NFT using the `SimpleNFT.sol` contract: 
    * Add this card toward the bottom:
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
    * To handle this form, you will need a way to encode the data used to call the mint function. There are nicer ways to do this, but this approach will help you understand how contract calls work. First, get the ABI for `SimpleNFT.sol` and use it to make a contract interface with ethers: 
    ```
    const simpleNFTABI = [{"inputs":[],"stateMutability":"nonpayable","t...;
    const simpleNFTInterface = new ethers.utils.Interface(simpleNFTABI); 
    ```
    * Then, add this function to handle the form: 
    ```
    const mintNFTHandler = async (e:Event) => { 
      if(!simpleNFTContractAddress) { return; }
      e.preventDefault();
      const data = new FormData(e.target);  
      const tokenURI = ""+data.get("mintNFTtokenURI");
      const functionData = simpleNFTInterface.encodeFunctionData('mint',[tokenURI]); 
      alert(functionData); 
    }; 
    ```
    * If you try it out, you will see an alert with a blob of hex data. Next you will use this to make a call with MetaMask: 
    ```
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
* Now you should be able to mint an NFT from the page. Try minting with this `tokenURI`: `https://www.rd.com/wp-content/uploads/2020/12/GettyImages-78777891-scaled.jpg`. 
* Next, you need to be able to approve the NFT Vault to transfer your NFT on your behalf. Add the following card: 
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
And the following function: 
```
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
```
This may look a bit confusing, but note this is a call to the *NFT contract* to approve the NFT Vault to transfer the token ID. This is a standard method that any NFT contract should have (unless transfers are disabled). Now you should be able to approve the NFT to deposit with the address for the `SimpleNFT.sol` contract and the token ID: 1. 
* Next, add the forms and functions you will need to use the `NFTVault.sol` contract, but before you do that, add the NFTVault.sol ABI from the packages/truffle/build folder and create the Contract Interface for ethers to use: 
```
const NFTVaultABI = [{"inputs":[{"internalType":"address",...
const NFTVaultInterface = new ethers.utils.Interface(NFTVaultABI); 
```
Now, on to the contract functions: 
    * First add a method to deposit your NFT, but before you do that you need a second address to act as the approver. When you deposit the NFT, you specify this second address as someone authorized to approve the withdrawal; without that approval, the NFT will remain safely "vaulted" and no one can steal it, even if they get access to your account. Normally you would use the address of a real person you know, but since you are testing locally, the easiest way to do this is to add another account in MetaMask Flask. Open the account menu in MetaMask Flask and click "+ Create Account." For the account name, you can put "Approver." Then, copy this address from MetaMask Flask. 
    * For the deposit form, here's the card: 
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
    And here's the function: 
    ```
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
    ```
    Now you can deposit the NFT! Paste the address of the second account you created in MetaMask Flask into this form, then switch back to the first account before doing the deposit. Put the same NFT contract address and token ID that you just approved in the previous step, then click "Deposit."
    * Next add the code to approve and withdraw an NFT. Add these cards: 
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
    And these functions: 
    ```
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
    ```
    Now you can swith to the second account, approve the NFT for withdrawal, switch back to the first account, and withdraw it! To confirm that this works, you can try withdrawing an NFT that you didn't already approve -- you will see that it fails.

Now the dapp is fully functioning. Next, build a snap that can decode these transactions and use the same smart NFT Vault contract to provide some meaningful information. In this case, it will tell the user whether the NFT they want to withdraw is approved for withdrawal. 

* Navigate to the snap package folder: `../snap`
* We are going to build a transaction insights snap, so open the `snap.manifest.json` file and add the permission for transaction insights: `"endowment:transaction-insight": {}`
* In `src/index.ts`, update the first import to look like this: 
```
import {
  OnTransactionHandler,
  OnRpcRequestHandler,
} from '@metamask/snap-types';
```
And add the following function: 
```
/**
 * Handle an incoming transaction, and return any insights.
 *
 * @param args - The request handler args as object.
 * @param args.transaction - The transaction object.
 * @returns The transaction insights.
 */
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  return {
    insights: { 
      testMessage: "Hello world!"
    }
  };
};
```
* Since you have updated the snap, you need to re-install it. Click the first button in the dapp "Reconnect." The installation popup will have a new permission: "Fetch and display transaction insights." Approve and install. 
* Now try any of the contract interactions, like Mint NFT. You will see a new tab in the pre-transaction popu, "TYPESCRIPT EXAMPLE" with "testMessage, Hello World!" 
* Now that you know how to show transaction insights with a snap, update the snap to be more useful. 