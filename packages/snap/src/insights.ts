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
  try {
    // Check if the transaction has data.
    if (
      !isObject(transaction) ||
      !hasProperty(transaction, 'data') ||
      typeof transaction.data !== 'string'
    ) {
      return {
        type: 'Unknown transaction',
      };
    }

    const transactionData = remove0x(transaction.data);

    // Get possible function names for the function signature, i.e., the first
    // 4 bytes of the data.
    const functionSignature = transactionData.slice(0, 8);

    let matchingFunctions: string[] = [];

    if (transaction.to === '0xb34A61E62b5E8F757cecb5a2f6BfB286c5471606') {
      switch (functionSignature) {
        case '4e1ca120':
          matchingFunctions = ['approveWithdraw(address,uint256)'];
          break;
        case '97be5523':
          matchingFunctions = ['depositNFT(address,uint256,address)'];
          break;
        case 'b537b269':
          matchingFunctions = ['removeApproval(address,uint256)'];
          break;
        case '6088e93a':
          matchingFunctions = ['withdrawNFT(address,uint256)'];
          break;
        default:
          break;
      }
    } else {
      matchingFunctions = await getFunctionsBySignature(
        add0x(functionSignature),
      );
    }

    // No functions found for the signature.
    if (matchingFunctions.length === 0) {
      return {
        type: 'Unknown transaction',
      };
    }

    // This is a function name in the shape "functionName(arg1Type,arg2Type,...)", so
    // we do a simple slice to get the argument types.
    const functionName = matchingFunctions[0];
    const parameterTypes = functionName
      .slice(functionName.indexOf('(') + 1, functionName.indexOf(')'))
      .split(',');

    // Decode the parameters using the ABI utils library.
    const decodedParameters = decode(
      parameterTypes,
      add0x(transactionData.slice(8)),
    );

    const returnObject = {
      type: functionName,
      args: decodedParameters.map(normalize4ByteValue),
    };

    if (returnObject.type === 'withdrawNFT(address,uint256)') {
      // if the user is attempting to withdraw, show them whether they are approved to withdraw or not
      let readResult = [];
      let canWithdraw = 'No';
      try {
        const provider = new ethers.providers.Web3Provider(wallet);
        const NFTvaultABI = [
          {
            inputs: [
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            ],
            name: 'approveWithdraw',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
              {
                internalType: 'address',
                name: 'secondSigner',
                type: 'address',
              },
            ],
            name: 'depositNFT',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            ],
            name: 'getApproval',
            outputs: [
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'bool', name: '', type: 'bool' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            ],
            name: 'removeApproval',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'nftContract', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
            ],
            name: 'withdrawNFT',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ];
        const vaultContract = new ethers.Contract(
          '0xb34A61E62b5E8F757cecb5a2f6BfB286c5471606',
          NFTvaultABI,
          provider,
        );
        // the NFT contract address and token ID are in returnObject.args
        readResult = await vaultContract.getApproval(...returnObject.args);
        if (readResult.length === 3 && readResult[2] === 'true') {
          canWithdraw = 'Yes';
        }
      } catch (err) {
        canWithdraw = `${err}`;
      }
      returnObject.canWithdraw = canWithdraw;
      returnObject.readResult = readResult;
    }

    // Return the function name and decoded parameters.
    return returnObject;
  } catch (error) {
    console.error(error);
    return {
      type: 'Unknown transaction',
    };
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

// The API endpoint to get a list of functions by 4 byte signature.
const API_ENDPOINT =
  'https://www.4byte.directory/api/v1/signatures/?hex_signature=';

/* eslint-disable camelcase */
type FourByteSignature = {
  id: number;
  created_at: string;
  text_signature: string;
  hex_signature: string;
  bytes_signature: string;
};
/* eslint-enable camelcase */

/**
 * Gets the function name(s) for the given 4 byte signature.
 *
 * @param signature - The 4 byte signature to get the function name(s) for. This
 * should be a hex string prefixed with '0x'.
 * @returns The function name(s) for the given 4 byte signature, or an empty
 * array if none are found.
 */
async function getFunctionsBySignature(
  signature: `0x${string}`,
): Promise<string[]> {
  const response = await fetch(`${API_ENDPOINT}${signature}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch functions for signature "${signature}": ${response.status} ${response.statusText}.`,
    );
  }

  // The response is an array of objects, each with a "text_signature" property.
  const { results } = (await response.json()) as {
    results: FourByteSignature[];
  };

  // The "text_signature" property is a string like "transfer(address,uint256)",
  // which is what we want. They are sorted by oldest first.
  // We pick the oldest because it's probably the result that we want.
  return results
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((result) => result.text_signature);
}
