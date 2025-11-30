# Local Relayer Setup Guide

> **⚠️ Note:** Docker is **NOT required** for most testing! The app works with Zama's public relayer on Sepolia by default. See [NO_DOCKER_NEEDED.md](./NO_DOCKER_NEEDED.md) for the easier option.

This guide explains how to set up a **local relayer** (only needed for Hardhat local network testing).

## Option 1: Using Docker (Recommended)

### Prerequisites
- Docker installed on your system
- Docker Compose (usually included with Docker)

### Steps

1. **Create a `docker-compose.yml` file** in your project root:

```yaml
version: '3.9'
services:
  fhevm-relayer:
    image: zamafhe/relayer:latest
    ports:
      - "8010:8010"
    environment:
      - FHEVM_NETWORK=local
      - RUST_LOG=info
    volumes:
      - relayer-data:/data
volumes:
  relayer-data:
```

2. **Start the relayer**:
```bash
docker-compose up -d
```

3. **Verify it's running**:
```bash
curl http://localhost:8010/health
```

4. **View logs** (optional):
```bash
docker-compose logs -f fhevm-relayer
```

5. **Stop the relayer**:
```bash
docker-compose down
```

## Option 2: Using Zama's Public Relayer (For Sepolia Testnet)

If you're testing on Sepolia testnet, you can use Zama's public relayer. No local setup needed - just use `SepoliaConfig` in your code.

## Frontend Configuration

The frontend is configured to automatically detect the environment:
- **Development mode**: Uses local relayer at `http://localhost:8010`
- **Production mode**: Uses Sepolia public relayer

## Testing in Browser Console

Once the relayer is running:

1. **Start your frontend**:
```bash
cd frontend
npm run dev
```

2. **Open browser console** (F12)

3. **Connect your wallet** in the app

4. **Watch the console** for:
   - `FHEVM initialized` - SDK ready
   - `Encrypting your loan application data...` - Encryption in progress
   - `Encrypted inputs created` - Encryption successful
   - `Decrypting...` - Decryption in progress
   - `Decryption successful!` - Decryption complete

## Troubleshooting

### Relayer not connecting
- Check if relayer is running: `curl http://localhost:8010/health`
- Check browser console for CORS errors
- Ensure relayer port matches frontend config (8010)

### Encryption/Decryption errors
- Verify wallet is connected
- Check that contract is deployed
- Ensure you're on the correct network (Hardhat local or Sepolia)

## Additional Resources

- [Zama Documentation](https://docs.zama.org)
- [Relayer SDK Guide](https://docs.zama.org/protocol/relayer-sdk-guides)
- [Zama Community Forum](https://community.zama.org)

