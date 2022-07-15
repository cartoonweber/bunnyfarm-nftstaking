import { useEffect, useState } from "react";
import CONFIG from './../abi/config.json'
import contractABI from './../abi/abi.json'
import multicallABI from '../abi/multicall.json'
import { ethers } from "ethers";

const RPC_ENDPOINT = 'https://api.elastos.io/eth'

const simpleRpcProvider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);

const getContract = (abi, address, signer) => {
    const signerOrProvider = signer ?? simpleRpcProvider
    return new ethers.Contract(address, abi, signerOrProvider)
}

const getMulticallContract = (chainId, signer) => {
    return getContract(multicallABI, CONFIG.MULTICALL_ADDRESS, signer)
}

const multicall = async (abi, calls) => {
    try {
        const itf = new ethers.utils.Interface(abi)
        const multi = getMulticallContract();
        const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])

        const { returnData } = await multi.aggregate(calldata)
        const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call))

        return res
    } catch (error) {
        console.log(error);
    }
}

const useNFTInfo = (provider, tokenIds, lockdata, selectedStNFTs, setTotalReward) => {
    const [infos, setInfos] = useState(null)
    const fetchNFTInfos = async (tokenIds, lockdata, selectedStNFTs, setTotalReward) => {
        try {

            if (!lockdata) return;

            let calls = tokenIds.map((id) => {
                return ({
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'vault',
                    params: [id],
                })
            })

            const vault = await multicall(contractABI, calls);
            console.log(vault);
            let reward = [], totalReward = 0;

            for (let i = 0; i < vault.length; i++) {
                let totalStakeReward = (vault[i].stakingPeriod / 1 === 0 ? lockdata[4][0] / Math.pow(10, 13)
                    : vault[i].stakingPeriod === 1
                        ? lockdata[5][0] / Math.pow(10, 13)
                        : vault[i].stakingPeriod === 2
                            ? lockdata[6][0] / Math.pow(10, 13)
                            : vault[i].stakingPeriod === 3
                                ? lockdata[7][0] / Math.pow(10, 13)
                                : 0);
                console.log(totalStakeReward)


                const periodValue = (vault[i].stakingPeriod === 0 ? lockdata[0][0] / 1 : vault[i].stakingPeriod === 1
                    ? lockdata[1][0] / 1
                    : vault[i].stakingPeriod === 2
                        ? lockdata[2][0] / 1
                        : vault[i].stakingPeriod === 3
                            ? lockdata[3][0] / 1
                            : 0);
                console.log(periodValue)

                const noOfDays = Math.min(periodValue, (Date.now() / 1000 - vault[i].timestamp / 1) / 86400);
                console.log(noOfDays)

                reward.push({
                    reward: totalStakeReward / periodValue * noOfDays,
                    periodValue,
                    apr: totalStakeReward / periodValue * 100,
                    withdrawable: noOfDays === periodValue
                });

                totalReward += selectedStNFTs.includes(tokenIds[i]) && noOfDays === periodValue ? totalStakeReward / periodValue * noOfDays : 0;
            }
            setTotalReward(totalReward);
            console.log(reward);
            setInfos(reward);

        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        fetchNFTInfos(tokenIds, lockdata, selectedStNFTs, setTotalReward)
    }, [tokenIds, lockdata, selectedStNFTs, setTotalReward])

    return infos;

}

export default useNFTInfo