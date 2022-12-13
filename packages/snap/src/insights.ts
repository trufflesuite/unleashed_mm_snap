import {
  add0x,
  bytesToHex,
  hasProperty,
  isObject,
  remove0x,
} from '@metamask/utils';
import { decode } from '@metamask/abi-utils';
import { ethers } from 'ethers';

/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {

  const returnObject: Record<string, any> = {
    message: 'Unknown transaction',
  };

  try {
    // Check if the transaction has data.
    if (
      !isObject(transaction) ||
      !hasProperty(transaction, 'data') ||
      typeof transaction.data !== 'string'
    ) {
      throw "Transaction data received is not an object."; 
    }

    switch(transaction.to) { 
      case '0x6bFfFAa39B39Aa3A8Ac621a6d9DFe7Fd0Db50a24'.toLowerCase(): 
        returnObject.message = "You are interacting with the SimpleNFT.sol contract"; 
        break; 
      case '0x967f72Eb961AcB03D11b34c5CC41F383ec19f78B'.toLowerCase(): 
        returnObject.message = "You are interacting with the NFTVault.sol contract"; 

        const transactionData = remove0x(transaction.data);

        // Get function signature, i.e., the first 4 bytes of the data.
        const functionSignature = transactionData.slice(0, 8);

        let matchingFunction = '';  

        switch (functionSignature) {
          case '4e1ca120':
            matchingFunction = 'approveWithdraw(address,uint256)';
            break;
          case '97be5523':
            matchingFunction = 'depositNFT(address,uint256,address)';
            break;
          case 'b537b269':
            matchingFunction = 'removeApproval(address,uint256)';
            break;
          case '6088e93a':
            matchingFunction = 'withdrawNFT(address,uint256)';
            break;
          default:
            break;
        }

        if(matchingFunction.length > 0) { 
          returnObject.method = matchingFunction; 
        }

        if(matchingFunction === 'withdrawNFT(address,uint256)') { 

          // This is a function name in the shape "functionName(arg1Type,arg2Type,...)", so
          // we do a simple slice to get the argument types.
          const parameterTypes = matchingFunction
            .slice(matchingFunction.indexOf('(') + 1, matchingFunction.indexOf(')'))
            .split(',');

          // Decode the parameters using the ABI utils library.
          const decodedParameters = decode(
            parameterTypes,
            add0x(transactionData.slice(8)),
          );

          returnObject.args = decodedParameters; 

          // now show them whether they are approved to withdraw or not
          let readResult = [];
          returnObject.canWithdraw = 'No'; 
          try {
            const [from] = (await wallet.request({
              method: 'eth_requestAccounts',
            })) as string[];/*
            const provider = new ethers.providers.Web3Provider(wallet); 
            // const provider = new ethers.providers.Web3Provider(wallet);
            const NFTvaultABI = [{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"secondSigner","type":"address"}],"name":"depositNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"withdrawNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approveWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproval","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"removeApproval","outputs":[],"stateMutability":"nonpayable","type":"function"}]; 
            const vaultContract = new ethers.Contract(
              '0x967f72Eb961AcB03D11b34c5CC41F383ec19f78B',
              NFTvaultABI,
              provider,
            );
            // the NFT contract address and token ID are in returnObject.args
            readResult = await vaultContract.getApproval(...returnObject.args);
            if (readResult.length === 3 && readResult[2] === 'true') {
              returnObject.canWithdraw = 'Yes';
            }*/
            returnObject.from = from; 
          } catch (err) {
            returnObject.canWithdraw = `${err}`;
          }
          returnObject.readResult = readResult;

        }
    }

    return returnObject;
  } catch (error) {
    console.error(error);
    return returnObject; 
  }
}