//organizerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

import voting from "./Create.json";

export const VotingAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const VotingAddressABI = voting.abi;


export const CONTRACT_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const networks = {
    localhost2: {
        chainId: `0x${Number(31337).toString(16)}`,
        chainName: "localhost",
        nativeCurrency: {
            name: "GO",
            symbol: "GO",
            decimals: 18,
        },
        rpcUrls: ["http://127.0.0.1:8545/"],
        blockExplorerUrls: ["https://bscscan.com"],
    },
}

const changeNetwork = async ({networkName }) => {
    try {
        if(!window.ethereum) throw new Error("No crypto wallet found");
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    ...networks[networkName],
                },
            ],
        });
    } catch (err) {
        console.log(err.message);
    }
};

export const handleNetworkSwitch = async () => {
    const networkName = 'localhost2';
    await changeNetwork({ networkName });
}