const SimpleNFT = artifacts.require('SimpleNFT');
const NFTVault = artifacts.require('NFTVault');

module.exports = function (deployer) {
  deployer.deploy(SimpleNFT);
  deployer.deploy(NFTVault);
};
