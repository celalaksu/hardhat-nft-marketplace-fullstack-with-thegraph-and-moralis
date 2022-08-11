const { network, ethers } = require("hardhat")
const { moveBlocks, sleep } = require("../utils/move-blocks")

const PRICE = ethers.utils.parseEther("0.1")

async function mint() {
    const basicNft = await ethers.getContract("BasicNFT")
    console.log("Minting.......")
    const mintTx = await basicNft.mintNFT()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`Got TokenId: ${tokenId}`)
    console.log(`NFT Address: ${basicNft.address}`)

    if (network.config.chainId == 31337) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
