import {
  add0x,
  bytesToHex,
  hasProperty,
  isObject,
  remove0x,
} from '@metamask/utils';
import { decode } from '@metamask/abi-utils';
import { ethers } from 'ethers';
import SimpleNft from './contracts/SimpleNFT.json';
import NFTVault from './contracts/NFTVault.json';

/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {

  const returnObject: Record<string, unknown> = {
    message: 'Unknown transaction',
  };
  const networkId = await wallet.request({ method: 'net_version' });
  const SimpleNFTContractAddress = SimpleNft.networks[networkId]? SimpleNft.networks[networkId].address : null;
  console.log({networkId, SimpleNFTContractAddress});
  const NFTVaultContractAddress = NFTVault.networks[networkId]? NFTVault.networks[networkId].address : null;

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
      case SimpleNFTContractAddress.toLowerCase(): 
        returnObject.message = "You are interacting with the SimpleNFT.sol contract"; 
        break; 
      case NFTVaultContractAddress.toLowerCase(): 
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
            const provider = new ethers.providers.Web3Provider(wallet); 
            const vaultContract = new ethers.Contract(
              NFTVaultContractAddress,
              NFTVault.abi,
              provider,
            );
        
            const ethersReadResult = await vaultContract.getApproval(...returnObject.args);
            if (ethersReadResult.length === 3 && ethersReadResult[2] === true) {
              returnObject.canWithdraw = 'Yes';
            }
            returnObject.readResult = ethersReadResult; 
        
          } catch (err) {
            returnObject.canWithdraw = `${err}`;
          }
        }

        break; 
      default: 
        returnObject.message = "I do not recognize the address " + transaction.to; 
    }

    return returnObject;
  } catch (error) {
    console.error(error);
    return returnObject; 
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
}