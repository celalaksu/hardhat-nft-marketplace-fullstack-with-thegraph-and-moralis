import { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import nftMarketPlaceAbi from "../constants/NftMarketPlace.json"
import nftAbi from "../constants/BasicNFT.json"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"

import UpdateListingModal from "./UpdateListingModal"

const truncateString = (fullString, stringLength) => {
    if (fullString.length <= stringLength) return fullString
    const seperator = "...."
    const seperatorLength = seperator.length
    const charsToShow = stringLength - seperatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullString.substring(0, frontChars) +
        seperator +
        fullString.substring(fullString.length - backChars)
    )
}

// We will pass the nft data to the nftbox function
export default function NFTBox({ price, nftAddress, tokenId, marketPlaceAddress, seller }) {
    // We want to call token uri and then call the image uri to show the image
    // For this we actually have to wait thowse two API requests to get the actual image.
    // And save that image as state variable on this component here. For this will use useState.
    const { isWeb3Enabled, account } = useMoralis()
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDesription, setTokenDescription] = useState("")

    const [showModal, setShowModal] = useState(false)
    const hideModel = () => setShowModal(false)

    const dispatch = useNotification()
    //const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: {
            tokenId: tokenId,
        },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketPlaceAbi,
        contractAddress: marketPlaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
        },
    })

    async function updateUI() {
        const tokenURI = await getTokenURI()
        console.log(`The TokenURI is ${tokenURI}`)
        console.log("nft address is : ", nftAddress)
        // We are going to cheat a little here...
        if (tokenURI) {
            // Grab token uri and get image
            // Use IPFS Gateway
            console.log("GETTİNG İMAGE URL")
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            console.log(requestURL)
            const tokenURIResponse = await (await fetch(requestURL)).json()
            console.log(tokenURIResponse)
            const imageURI = tokenURIResponse.image
            const imgaeURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imgaeURIURL)

            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
        }
        // get the tokenURI --> to get the token uri will use useWeb3Contract
        // using the image tab from the tokenURI, get the image
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // this run only anytime is web three enabled changes.

    const isOwnedByUser = seller === account || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "You" : truncateString(seller || "", 15)

    const handleCardClick = () => {
        isOwnedByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => console.log(error),
                  onSuccess: () => handleBuyItemSuccess(),
              })
    }

    const handleBuyItemSuccess = /*async (tx)*/ () => {
        //await tx.wait(1)
        dispatch({
            type: "success",
            message: "Item bought",
            title: "Item Bought",
            position: "topR",
        })
        //onClose && onClose()
        //setPriceToUpdateListingWith("0")
    }

    return (
        <div>
            <div>
                {imageURI ? (
                    <div>
                        <UpdateListingModal
                            isVisible={showModal}
                            tokenId={tokenId}
                            marketPlaceAddress={marketPlaceAddress}
                            nftAddress={nftAddress}
                            onClose={hideModel}
                        />
                        <Card
                            title={tokenName}
                            description={tokenDesription}
                            onClick={handleCardClick}
                        >
                            <div className="p-2">
                                <div className="flex flex-col items-end gap-2">
                                    <div>#{tokenName}</div>
                                    <div className="italic text-sm">
                                        Owned by {formattedSellerAddress}
                                    </div>
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    ></Image>
                                    <div className="font-bold">
                                        Price : {ethers.utils.formatUnits(price, "ether")} ETH
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div> Loading...</div>
                )}
            </div>
        </div>
    )
}
