# Unleashed mm-snap tutorial

This project starts from the [4byte API snap](https://github.com/Montoya/tx-insights-with-4byte-snap) plus the 2 contracts `SimpleNFT.sol` and `NFTVault.sol`. The following is a tutorial. Run `yarn install && yarn start` in the main directory to get the development environment started, then follow these steps: 

1. In `packages/site/src/components/Card.tsx`, change line 7 to `description: string | ReactNode;`. This will allow for using HTML in card descriptions. 
2. In the same file, change line 8 to `button?: ReactNode;`. This will make the button prop optional. 
3. In the same file, change line 43 to `const Description = styled.div`. This will make it possible to put any kind of HTMl inside of description. 
4. In `packages/site/src/pages/index.tsx`, delete the last two cards. 
5. Now add a card and function to store the addresses of the two smart contracts `SimpleNFT.sol` and `NFTVault.sol`. 
    1. Update the first import to include `useState` from `React`. 
    2. In the `Index` function, add: 
    ```
    const [simpleNFTContractAddress, setSimpleNFTContractAddress] = useState(); 
    const [NFTVaultContractAddress, setNFTVaultContractAddress] = useState(); 
    ```
    3. Further down in the same function, add: 
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
    4. And towards the bottom, add this card: 
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
6. Open another terminal, go to the truffle package directory, and run `yarn run deploy`. This will execute a deployment of the two contracts with truffle. You should see the addresses where the contracts are deployed in the output (and also in the terminal where the site, snap, and truffle are all running). Remember these addresses so you can set them in the site with the form you just created. 
7. Now add a card and function to mint NFTs using the `SimpleNFT.sol` contract. 
    1. Towards the bottom, add this card: 
    ```
    {simpleNFTContractAddress && ( 
      <Card
        content={{
          title: 'Mint an NFT',
          description: (
            <form id="mintNFT" onSubmit={mintNFTHandler}>
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
    2. We are going to need a way to encode the method and parameters when calling these functions, so stop the packages and add the `web3-eth-abi` package to this project in `packages/site`: `yarn add web3-eth-abi`, then import it into this file: `import Web3EthAbi from 'web3-eth-abi';`. 
    3. Unfortunately this introduces an issue with a missing polyfill, so we have to take a detour and resolve it. Run `yarn add --dev react-app-rewired process crypto-browserify stream-browserify assert stream-http https-browserify os-browserify url buffer` and then add a file `gatsby-node.js` with the following: 
    ```
    const webpack = require("webpack");

    exports.onCreateWebpackConfig = ({ actions }) => {
        actions.setWebpackConfig({
            plugins: [
                new webpack.ProvidePlugin({
                    Buffer: [require.resolve("buffer/"), "Buffer"],
                }),
            ],
            resolve: {
                fallback: {
                    crypto: require.resolve('crypto-browserify'),
                    stream: require.resolve('stream-browserify'), 
                    assert: require.resolve('assert'), 
                    http: require.resolve('stream-http'), 
                    https: require.resolve('https-browserify'), 
                    os: require.resolve('os-browserify'),
                    url: require.resolve('url'), 
                },
            }
        })
    };
    ```
    Go back up to the main directory and start the packages again with `yarn start`. 
    4. Now add the following function: 
    ```
    const mintNFTHandler = async (e:Event) => { 
      e.preventDefault();
      const data = new FormData(e.target);  
      const tokenURI = ""+data.get("mintNFTtokenURI"); 
      const encodedData = Web3EthAbi.encodeFunctionCall({
        name: 'mint', 
        type: 'function', 
        inputs: [{
          type: 'string', 
          name: '_tokenURI'
        }]
      }, [tokenURI]); 
      try { 
        await sendContractTransaction(
          simpleNFTContractAddress, 
          encodedData,
        ); 
      } catch (e) {
        console.error(e);
        dispatch({ type: MetamaskActions.SetError, payload: e });
      }
    }; 
    ```
    This takes the tokenURI from the form, encodes a function call for the `mint` method with the tokenURI as a parameter, and then makes a call to MetaMask to send the contract transaction. 
8. Now it's finally time to mint an NFT! Try minting with this `tokenURI`: `https://www.rd.com/wp-content/uploads/2020/12/GettyImages-78777891-scaled.jpg`. 