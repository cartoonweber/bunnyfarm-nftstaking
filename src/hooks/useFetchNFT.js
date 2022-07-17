import { useEffect, useState } from "react";
import CONFIG from './../abi/config.json'
import NFTABI from '../abi/nft.json'
import { ethers } from "ethers";

const useFetchNFT = (provider, account, fetchNFTs, setFetchNFTs) => {
    const [nft, setNFT] = useState(null)
    const fetchWalletNFTs = async (account) => {
        try {
            const signer = provider.getSigner()
            const nftContract = new ethers.Contract(CONFIG.NFT_CONTRACT, NFTABI, signer);
            const tokenids = await nftContract.walletOfOwner(account);
            console.log(tokenids);
            let nft = { ownedNfts: [] };
            for (let i = 0; i < tokenids.length; i++) {
                const id = tokenids[i] / 1;
                nft.ownedNfts.push({
                    id: {
                        tokenId: id.toString(16)
                    },
                    media: [{ gateway: `https://gateway.pinata.cloud/ipfs/QmTbSwRsNouyjjsDzEUJyTEFXnqZL93ouk38SMmR74biXw/Bunny_${id}.jpg` }],
                    title: `Bunny #${id}`
                })
            }
            setNFT(nft)
            setFetchNFTs(false)

        } catch (e) {
            console.log(e)
            setFetchNFTs(false)
        }
    }

    useEffect(() => {
        if (fetchNFTs) {
            fetchWalletNFTs(account)
        }
    }, [account, fetchNFTs])

    return nft

}

export default useFetchNFT