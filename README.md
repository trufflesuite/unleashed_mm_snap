# Unleashed Tutorial

This tutorial assumes a fresh install of the MetaMask Snaps Truffle Box with the NFTVault.sol and SimpleNFT.sol contracts and tests added. 

To proceed: 

* Deploy the contracts by going to the `packages/truffle` directory and running `yarn run deploy`
* Note the addresses they are deployed at
* Find the `NFTVault.sol` contract ABI in the `build` folder, in the file `NFTVault.json`
* Using the command line, mint a few NFTs using the `SimpleNFT.sol` contract to the address you are using in MetaMask Flask: 
    * `truffle console`
    * let contract = await SimpleNFT.deployed();
    * contract.mint("123"); 

Now you are ready to build the NFT Vault dapp to use the `NFTVault.sol` contract. 
