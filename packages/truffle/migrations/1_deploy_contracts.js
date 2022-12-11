const SimpleNFT = artifacts.require('SimpleNFT');
const NFTVault = artifacts.require('NFTVault');

module.exports = function (deployer) {
  deployer.deploy(SimpleNFT).then(() => console.log("Simple NFT contract deployed at: "+SimpleNFT.address)); 
  deployer.deploy(NFTVault).then(() => console.log("NFT Vault contract deployed at: "+NFTVault.address)); 
};
