# Unleashed Tutorial

This tutorial assumes a fresh install of the MetaMask Snaps Truffle Box with the NFTVault.sol and SimpleNFT.sol contracts and tests added. Make sure you have followed the steps in the original README and you ran `yarn install && yarn start` to start your development environment. 

To proceed: 

* Deploy the contracts by going to the `packages/truffle` directory and running `truffle migrate`
  ```
  cd packages/truffle
  truffle migrate
  ```
* Note the addresses they are deployed at. You can also get them by calling `truffle networks`
* Using the command line, mint a few NFTs using the `SimpleNFT.sol` contract to the address you are using in MetaMask Flask: 
    * `truffle console`
    * `let contract = await SimpleNFT.deployed();`
    * `contract.mint("123");`
* Or, send some ETH to the address you are using in Flask so you can use it later: 
    * `let accounts = await web3.eth.getAccounts();`
    * `web3.eth.sendTransaction({to:"[your account]",from:accounts[0],value:web3.utils.toWei('1',"ether")});`

Now you are ready to build the NFT Vault dapp to use the `NFTVault.sol` contract. 

* Go back to the main directory and navigate to `packages/site`
* We will need to use the `ethers` library to interact with smart contracts and MetaMask, so add it to the project: `yarn add ethers` and then import it at the top of `src/index.tsx`: `import { ethers } from 'ethers'`
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