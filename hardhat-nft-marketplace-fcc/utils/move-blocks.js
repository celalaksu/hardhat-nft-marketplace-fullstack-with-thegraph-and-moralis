const { network } = require("hardhat")

function sleep(timeInMs) {
    return new Promise((resolve) => setTimeout(resolve, timeInMs))
}

async function moveBlocks(amount, sleepAmount = 0) {
    // amount--> number of blocks
    // sleepAmount --> optional parameter, if we want to move blocks and sleep maybe asecond between blocks
    // to resemble a real blockchain
    console.log("Moving blocks....")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        })
        if (sleepAmount) {
            console.log(`Sleeping for ${sleepAmount}`)
            await sleep(sleepAmount)
        }
    }
}

module.exports = { moveBlocks, sleep }
