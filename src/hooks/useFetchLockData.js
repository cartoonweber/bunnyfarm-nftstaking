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

const useFetchLockData = () => {
    const [infos, setInfos] = useState(null)
    const fetchNFTInfos = async () => {
        try {

            let calls = [
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'smallOpt',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'mediumOpt',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'largeOpt',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'xlargeOpt',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'smallReward',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'mediumReward',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'largeReward',
                    params: [],
                },
                {
                    address: CONFIG.STAKING_CONTRACT_ADDRESS,
                    name: 'xlargeReward',
                    params: [],
                },
            ];

            const stakingInfo = await multicall(contractABI, calls);

            console.log(stakingInfo);

            setInfos(stakingInfo);

        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        fetchNFTInfos()
    }, [])

    return infos;

}

export default useFetchLockData