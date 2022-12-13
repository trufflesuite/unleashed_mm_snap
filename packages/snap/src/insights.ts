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
    message: 'Unknown address',
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
      case '0x363006B693F3abbd9F476605A555c26642A39ed9'.toLowerCase(): 
        returnObject.message = "You are interacting with the SimpleNFT.sol contract"; 
        break; 
      case '0x0C4D665424c61c32229FDeBe04d0793eA5DA6ede'.toLowerCase(): 
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

          returnObject.args = decodedParameters.map(normalize4ByteValue); 

          // now show them whether they are approved to withdraw or not
          returnObject.canWithdraw = 'No'; 
          try {
            
            const NFTvaultABI = [{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"secondSigner","type":"address"}],"name":"depositNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"withdrawNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approveWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproval","outputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function","constant":true},{"inputs":[{"internalType":"address","name":"nftContract","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"removeApproval","outputs":[],"stateMutability":"nonpayable","type":"function"}]; 
/*
            const vaultContractInterface = new ethers.utils.Interface(NFTvaultABI);

            const tokenID = "1"; 
            const nftContractAddress = "0x363006B693F3abbd9F476605A555c26642A39ed9"; 
            const functionData = vaultContractInterface.encodeFunctionData('getApproval',[nftContractAddress,tokenID]); 

            const response = await wallet.request({
              method: 'eth_call',
              params: [
                {
                  //from: from,
                  to: '0x0C4D665424c61c32229FDeBe04d0793eA5DA6ede',
                  value: '0x0',
                  data: functionData,
                },
              ],
            });
            const readResult = decode(['address','address','bool'],response); 
            
            if (readResult.length === 3 && readResult[2] === 'true') {
              returnObject.canWithdraw = 'Yes';
            }
            returnObject.readResult = JSON.stringify(readResult); 

            returnObject.chainId = await wallet.request({
              method: 'eth_chainId'
            }); 
*/
            const provider = new ethers.providers.Web3Provider(wallet); 
            const vaultContract = new ethers.Contract(
              '0x0C4D665424c61c32229FDeBe04d0793eA5DA6ede',
              NFTvaultABI,
              provider,
            );

            const ethersReadResult = await vaultContract.getApproval(...returnObject.args);
            if (ethersReadResult.length === 3 && ethersReadResult[2] === 'true') {
              returnObject.canWithdraw = 'Yes';
            }
            else { 
              returnObject.canWithdraw = 'No, you need to get approval from ' + ethersReadResult[1]; 
            }
            returnObject.readResult = ethersReadResult; 

          } catch (err) {
            returnObject.canWithdraw = `${err}`;
          }
        }
    }

    return returnObject;
  } catch (error) {
    console.error(error);
    return returnObject; 
  }
}

/**
 * The ABI decoder returns certain which are not JSON serializable. This
 * function converts them to strings.
 *
 * @param value - The value to convert.
 * @returns The converted value.
 */
function normalize4ByteValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize4ByteValue);
  }

  if (value instanceof Uint8Array) {
    return bytesToHex(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return value;
}