# Unleashed Tutorial

This tutorial assumes a fresh install of the MetaMask Snaps Truffle Box with the NFTVault.sol and SimpleNFT.sol contracts and tests added. Make sure you have followed the steps in the original README and you ran `yarn install && yarn start` to start your development environment. 

To proceed: 

* Deploy the contracts by going to the `packages/truffle` directory and running `yarn run deploy`
* Note the addresses they are deployed at
* Find the `NFTVault.sol` contract ABI in the `build` folder, in the file `NFTVault.json`
* Using the command line, mint a few NFTs using the `SimpleNFT.sol` contract to the address you are using in MetaMask Flask: 
    * `truffle console`
    * let contract = await SimpleNFT.deployed();
    * contract.mint("123"); 

Now you are ready to build the NFT Vault dapp to use the `NFTVault.sol` contract. 

* Go back to the main directory and navigate to `packages/site`
* We will need to use the `ethers` library to interact with smart contracts and MetaMask, so add it to the project: `yarn add ethers` and then import it at the top of `src/index.tsx`: `import { ethers } from 'ethers';`
* Next we will make the card components more flexible to be able to use forms. Make the following changes: 
    * In `src/components/Card.tsx`, change line 7 to `description: string | ReactNode;`. This will allow for using HTML in card descriptions.
    * In the same file, change line 8 to `button?: ReactNode;`. This will make the button prop optional.
    * In the same file, change line 43 to `const Description = styled.div`\`. This will make it possible to put any kind of HTML inside of description.
