import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { ethers } from "ethers"
import nftAbi from "../constants/BasicNFT.json"
import nftMarketPlaceAbi from "../constants/NftMarketPlace.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import { useEffect, useState } from "react"

export default function Home() {
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainidString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainidString].NftMarketPlace[0]

    const dispatch = useNotification()

    const [proceeds, setProceeds] = useState(0)

    const { runContractFunction } = useWeb3Contract()

    async function approveAndList(data) {
        console.log("Approving.........")

        const nftAddress = data.data[0].inputResult
        console.log("nft addres====", nftAddress)
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()

        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: marketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
    }
    async function handleApproveSuccess(nftAddress, tokenId, price) {
        console.log("Ok! Now time to list")
        console.log("nft addres====", nftAddress)
        const listOptions = {
            abi: nftMarketPlaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }

        await runContractFunction({
            params: listOptions,
            onError: (error) => console.log(error),
            onSuccess: handleListSuccess,
        })
    }

    async function handleListSuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "NFT listed",
            title: "NFT Listed",
            position: "topR",
        })
    }

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketPlaceAbi,
                contractAddress: marketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    const handleWitdrawSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        })
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            setupUI()
        }
    }, [proceeds, isWeb3Enabled, account, chainId])
    return (
        <div className="grid grid-flow-col gap-3">
            <div>
                <Form
                    onSubmit={approveAndList}
                    data={[
                        {
                            name: "NFT Address",
                            type: "text",
                            inputWidth: "50%",
                            value: "",
                            key: "nftAddress",
                        },
                        {
                            name: "Token ID",
                            type: "number",
                            value: "",
                            key: "tokenId",
                        },
                        {
                            name: "Price (in ETH)",
                            type: "number",
                            value: "",
                            key: "price",
                        },
                    ]}
                    title="Sell your NFT"
                />
            </div>
            <div>
                <div>
                    <h1>Withdraw {ethers.utils.formatUnits(proceeds, "ether")} ETH proceeds</h1>
                    {proceeds != "0" ? (
                        <Button
                            text="Withdraw"
                            type="button"
                            onClick={() => {
                                runContractFunction({
                                    params: {
                                        abi: nftMarketPlaceAbi,
                                        contractAddress: marketplaceAddress,
                                        functionName: "withdrawProceeds",
                                        params: {},
                                    },
                                    onError: (error) => console.log(error),
                                    onSuccess: handleWitdrawSuccess,
                                })
                            }}
                        />
                    ) : (
                        <div>No proceeds detected </div>
                    )}
                </div>
            </div>
        </div>
    )
}
