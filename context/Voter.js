import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";
import { useRouter } from "next/router";
const FormData = require("form-data");

//INTERNAL IMPORT
import { CONTRACT_OWNER, VotingAddress, VotingAddressABI, handleNetworkSwitch } from "./constants";

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(VotingAddress, VotingAddressABI, signerOrProvider);

export const VotingContext = React.createContext();

export const VotingProvider = ({ children }) => {
  const router = useRouter();
  const [currentAccount, setCurrentAccount] = useState("");
  const [candidateLength, setCandidateLength] = useState("");
  const [loader, setLoader] = useState(false);
  const pushCandidate = [];
  const candidateIndex = [];
  const [candidateArray, setCandidateArray] = useState(pushCandidate);
  // =========================================================
  //---ERROR Message
  const [error, setError] = useState("");
  const higestVote = [];

  const pushVoter = [];
  const [voterArray, setVoterArray] = useState(pushVoter);
  const [voterLength, setVoterLength] = useState("");
  const [voterAddress, setVoterAddress] = useState([]);
  ///CONNECTING METAMASK
  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return setError("Please Install MetaMask");

    const account = await window.ethereum.request({ method: "eth_accounts" });

    if (account.length) {
      setCurrentAccount(account[0]);
      getAllVoterData();
      getNewCandidate();
    } else {
      setError("Please Install MetaMask & Connect, Reload");
    }
  };

  // ===========================================================
  //CONNECT WELATE
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setCurrentAccount(accounts[0]);
    getAllVoterData();
    getNewCandidate();
  };
  // ================================================

  const uploadToIPFS = async (file) => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `95ff7c673b6fe268ec2b`,
            pinata_secret_api_key: `
            7f34948a5afa6c66c116183b3857a846f8f37ad08898e794bb37bc349af6e9a1`,
            "Content-Type": "multipart/form-data",
          },
        });
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

        return ImgHash;
      } catch (error) {
        console.log("Unable to upload image to Pinata");
      }
    }
  };

  const uploadToIPFSCandidate = async (file) => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `95ff7c673b6fe268ec2b`,
            pinata_secret_api_key: `
            7f34948a5afa6c66c116183b3857a846f8f37ad08898e794bb37bc349af6e9a1`,
            "Content-Type": "multipart/form-data",
          },
        });
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

        return ImgHash;
      } catch (error) {
        console.log("Unable to upload image to Pinata");
      }
    }
  };

  // =============================================
  //CREATE VOTER----------------------
  const createVoter = async (formInput, fileUrl) => {
    try {
      const { name, address, position } = formInput;
      const connectAddress = await checkIfWalletIsConnected();
    if(connectAddress == CONTRACT_OWNER)
      return setError("Only owner of Contract can create Candidate");

      if (!name || !address || !position)
        return console.log("Input Data is missing");
      setLoader(true);
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const data = JSON.stringify({ name, address, position, image: fileUrl });

      const response = await axios({
        method: "POST",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: data,
        headers: {
          pinata_api_key: `95ff7c673b6fe268ec2b`,
          pinata_secret_api_key: `
          7f34948a5afa6c66c116183b3857a846f8f37ad08898e794bb37bc349af6e9a1`,
          "Content-Type": "application/json",
        },
      });

      // console.log("api called");

      const url = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

      const voter = await contract.voterRight(address, name, url, fileUrl, {
        gasLimit: ethers.utils.hexlify(8000000),
      });
      voter.wait();
      setLoader(false);
      window.location.href = "/voterList";

      // console.log(voter);

      // router.push("/voterList");
    } catch (error) {
      setLoader(false);
      console.log(error);
    }
  };
  // =============================================

  // const getAllVoterData = async () => {
  //   try {
  //     const web3Modal = new Web3Modal();
  //     const connection = await web3Modal.connect();
  //     const provider = new ethers.providers.Web3Provider(connection);
  //     const signer = provider.getSigner();
  //     const contract = fetchContract(signer);
  //     //VOTR LIST
  //     const voterListData = await contract.getVoterList();
  //     setVoterAddress(voterListData);

  //     voterListData.map(async (el) => {
  //       const singleVoterData = await contract.getVoterData(el);
  //       pushVoter.push(singleVoterData);
  //     });

  //     //VOTER LENGHT
  //     const voterList = await contract.getVoterLength();
  //     setVoterLength(voterList.toNumber());
  //   } catch (error) {
  //     console.log("All data");
  //   }
  // };


  
  const getAllVoterData = async () => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const voterListData = await contract.getVoterList();
      setVoterAddress(voterListData);

      const pushVoter = []; // Create a new array to hold voter data
      await Promise.all(
        voterListData.map(async (el) => {
          const singleVoterData = await contract.getVoterData(el);
          pushVoter.push(singleVoterData);
        })
      );
      setVoterArray(pushVoter);
      setVoterLength(pushVoter.length);
    } catch (error) {
      console.log("Error fetching voter data:", error);
    }
  };


  // =============================================

  // =============================================
  ////////GIVE VOTE

  const giveVote = async (id) => {
    try {
      const connectAddress = await checkIfWalletIsConnected();
    if(connectAddress == CONTRACT_OWNER)
      return setError("Only owner of Contract can create Candidate");
    setLoader(true);
      const voterAddress = id.address;
      const voterId = id.id;
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = fetchContract(signer);

      const voteredList = await contract.vote(voterAddress, voterId, {
        gasLimit: ethers.utils.hexlify(8000000)});
      console.log(voteredList);
      setLoader(false);
    } catch (error) {
      setError("Sorry!, You have already voted, Reload Browser");
      setLoader(false);
    }
  };
  // =============================================

  const setCandidate = async (candidateForm, fileUrl, router) => {
    const { name, address, age } = candidateForm;
    const connectAddress = await checkIfWalletIsConnected();
    if(connectAddress == CONTRACT_OWNER)
      return setError("Only owner of Contract can create Candidate");
    try {
    if (!name || !address || !age) return console.log("Input Data is missing");
    setLoader(true);
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = fetchContract(signer);

    const data = JSON.stringify({
      name,
      address,
      image: fileUrl,
      age,
    });

    const response = await axios({
      method: "POST",
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      data: data,
      headers: {
        pinata_api_key: `95ff7c673b6fe268ec2b`,
        pinata_secret_api_key: `
        7f34948a5afa6c66c116183b3857a846f8f37ad08898e794bb37bc349af6e9a1`,
        "Content-Type": "application/json",
      },
    });

    const url = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

    const candidate = await contract.setCandidate(
      address,
      age,
      name,
      fileUrl,
      url, {
        gasLimit: ethers.utils.hexlify(8000000), }
    );
    candidate.wait();
    setLoader(false);
    window.location.href = "/";

  } catch (error){
      setLoader(false);
      setError("Something went Wrong, Check your API Key");
  }

    // router.push("/");
  };


  const getNewCandidate = async () => {
    try {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);

        //---------ALL CANDIDATE
        const allCandidate = await contract.getCandidate();
        console.log(allCandidate);

        //--------CANDIDATE DATA
        const updatedCandidateArray = [];
        const updatedCandidateIndex = [];
        await Promise.all(
            allCandidate.map(async (el) => {
                const singleCandidateData = await contract.getCandidateData(el);
                updatedCandidateArray.push(singleCandidateData);
                updatedCandidateIndex.push(singleCandidateData[2].toNumber());
            })
        );
        setCandidateArray(updatedCandidateArray);
        // setCandidateIndex(updatedCandidateIndex);

        //---------CANDIDATE LENGTH
        const allCandidateLength = await contract.getCandidateLength();
        setCandidateLength(allCandidateLength.toNumber());
    } catch (error) {
        console.error("Error fetching candidate data:", error);
    }
};


  return (
    <VotingContext.Provider
      value={{
        currentAccount,
        connectWallet,
        uploadToIPFS,
        createVoter,
        setCandidate,
        getNewCandidate,
        giveVote,
        pushCandidate,
        candidateArray,
        uploadToIPFSCandidate,
        getAllVoterData,
        voterArray,
        giveVote,
        checkIfWalletIsConnected,
        error,
        candidateLength,
        voterLength,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
};
