# IguVerse Contracts

IguVerse is the first blockchain game that links Socialize to Earn, Move to Earn, and Play to Earn mechanics into one gamified app. Mint NFT from your own pet photo or buy a virtual one from marketplace. Collect rewards for different activities such as sharing your pet photos on Instagram and TikTok or walking with your pet.

---

# Getting started

#### 1. Installation:

```
npm i
```

#### 2. Create `.env` file bassed on `.env.example` . Enter your developer purposes mnemonic phrase(12 words).
#### 3. Compile and Tests

```
npm run compile
```

```
npm run test
```

#### 4. Generate Documentation

To create documentation run
```
npm run docgen
```

Documentation files will appear in the `/docs` folder, open `index.html` in a browser to read it.

Also `/docs/contracts.json` file will be created which contains all deployed contract information (addresses, abis, etc);

#### 5. Local migrations/local deployment

   Run local node:

   ```
   npm run node
   ```

   It will run local virtual node and deploy contracts

#### 6. Testnet/production deployment

   Make sure that first account (id[0]) for selected mnemonic has a native currency on selected network. Use a faucets for a testnets.

   Testnet deployment:
   ```
   npm run testnet
   ```

   Production deployment (using MNEMONIC_MAINNET)
   ```
   npm run mainnet
   ```

   Deployment info will store on deployments folder

#### 7. Verifying on bscscan

   To verify contracts on mainnet run: 
   ```
   npm run verify
   ```

### Remix

remixd -s ~/Projects/iguverse-contracts --remix-ide https://remix.ethereum.org


### Mainnet

#### IGU token 

```0x201bC9F242f74C47Bbd898a5DC99cDCD81A21943```

https://bscscan.com/token/0x201bC9F242f74C47Bbd898a5DC99cDCD81A21943

#### IGUP token

```0x522d0F9F3eFF479A5B256BB1C1108F47b8e1A153```

https://bscscan.com/token/0x522d0F9F3eFF479A5B256BB1C1108F47b8e1A153

#### NFT token

```0x694733Ab1618A275D7E4b20d05fAaf450D56EfC6```

https://bscscan.com/token/0x694733Ab1618A275D7E4b20d05fAaf450D56EfC6

#### TokenDistributor

```0xb085320eaBC561506E818CE1BFc35347076c1184```

https://bscscan.com/address/0xb085320eaBC561506E818CE1BFc35347076c1184

#### IGU Wallet

```0x4C63e0d152aC4149E0d501ace532a12B0f553416```

https://bscscan.com/address/0x4C63e0d152aC4149E0d501ace532a12B0f553416

#### Staking IgupBooster

```0x2F9A670455E6E50Ee447f6Ea6e30E633DC42838D```

https://bscscan.com/address/0x2F9A670455E6E50Ee447f6Ea6e30E633DC42838D


#### LootBox

```0xccB77aEDEAB9c2defA271FFE253a09d9dC0569ae```

https://bscscan.com/token/0xccB77aEDEAB9c2defA271FFE253a09d9dC0569ae
