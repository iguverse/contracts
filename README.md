# Iguana Metaverse Contracts

**The p2e game.**

---

# Getting started

1. Installation:

```
npm i
```

2. Create `.env` file bassed on `.env.example` . Enter your developer purposes mnemonic phrase(12 words).
3. Compile and Tests

```
npm run compile
```

```
npm run test
```

4. Generate Documentation

```
npm run docgen
```

Documentation files will appear in the `/docs` folder, open `index.html` in a browser to read it.

5. Local migrations/local deployment

   Run local node:

   ```
   npm run node
   ```

   Open **second terminal **window and deploy contracts:

   ```
   npm run local
   ```

6. Testnet/production deployment

   Make sure that first account (id[0]) for selected mnemonic has a native currency on selected network. Use a faucets for a testnets.

   ```
   npx hardhat run --network fantomtestnet scripts/deploy.ts
   ```
