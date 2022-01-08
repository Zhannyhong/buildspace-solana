import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import React, {useEffect, useState} from "react";
import {clusterApiUrl, Connection, PublicKey} from '@solana/web3.js';
import {Program, Provider, web3} from '@project-serum/anchor';
import CandyMachine from './CandyMachine';
import isURL from 'validator/lib/isURL';
import request from 'superagent';
import idl from './idl.json';
import keypair from './keypair.json';

// Constants
const {SystemProgram, Keypair} = web3;
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const options = {preflightCommitment: "processed"};

const secretKey = new Uint8Array(Object.values(keypair._keypair.secretKey));
const baseAccount = Keypair.fromSecretKey(secretKey);

const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
    'https://media2.giphy.com/media/UpExHeypPdNXcNwCSD/giphy.gif?cid=790b76112f5e92f75a79dfcdf19c9343d466b033c5628eea&rid=giphy.gif&ct=g',
    'https://media4.giphy.com/media/ZLGc8xQXdXvvrwRfe6/giphy.gif?cid=790b76115d51190bc40c04ec54eb187b903578735e7b188e&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/cmYdQ0OXPKdfcxgvZH/giphy.gif?cid=790b7611cdab166e04d4712f12cc2ff17e24064de9206898&rid=giphy.gif&ct=g',
    'https://media1.giphy.com/media/oDSzlVeXHLsIg/giphy.gif?cid=790b761165391f526878ba54c455564d8fae82821408173d&rid=giphy.gif&ct=g'
]

const App = () => {
    // State
    const [walletAddress, setWalletAddress] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [gifList, setGifList] = useState([]);


    // Actions
    const checkForPhantomWallet = async () => {
        try {
            const {solana} = window;

            // Check for injected solana object
            if (solana && solana.isPhantom) {
                console.log("Phantom wallet found!");
                await connectPhantomWallet();
            } else {
                console.log("Solana wallet not found! Get a Phantom wallet NOW! 👻");
            }
        } catch (err) {
            console.log(err)
        }
    };

    const connectPhantomWallet = async (init = false) => {
        const {solana} = window;

        if (solana) {
            console.log("Connecting to Phantom wallet...");

            // Eagerly connect to Phantom wallet on page load (init is false)
            const response = await solana.connect(init ? {} : {onlyIfTrusted: true});
            const publicKey = response.publicKey.toString();

            setWalletAddress(publicKey);
            console.log("Successfully connected to Phantom wallet! Wallet public key:", publicKey);
        } else window.open("https://phantom.app/", "_blank");
    };

    const onInputChange = (event) => setInputValue(event.target.value);

    const submitGif = async () => {
        if (!await isValidInput(inputValue)) return false;

        setInputValue("");
        console.log("Gif link:", inputValue);

        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            console.log("Submitting gif...");
            await program.rpc.addGif(inputValue, {
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey
                }
            });
            console.log("Gif successfully added!");
        } catch (error) {
            console.log("Error submitting gif:", error);
        }
    }

    const isValidInput = async (input) => {
        if (input.length === 0) {
            console.log("No gif link provided! Please try again.");
            return false;
        }

        if (!isURL(input)) {
            console.log("Invalid URL provided! Please try again.");
            return false;
        }

        try {
            const response = await request.head(input);

            if (response.type !== "image/gif") {
                console.log("URL provided is not a GIF! Please try again.");
                return false;
            }
        } catch (error) {
            console.log("Error validating gif link:", error);
            return false;
        }

        if (gifList.includes(input)) {
            console.log("Gif already submitted! Please submit another gif.");
            return false;
        }

        return true;
    }

    const getProvider = () => {
        const connection = new Connection(network, options.preflightCommitment);
        return new Provider(connection, window.solana, options.preflightCommitment);
    }

    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            console.log("Creating new BaseAccount...");
            await program.rpc.initialise({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount]
            });

            console.log("New BaseAccount address:", baseAccount.publicKey.toString());
        } catch (error) {
            console.log("Error creating BaseAccount:", error);
        }
    }

    const getGifList = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

            console.log("Account:", account);
            return account.gifList;
        } catch (error) {
            console.log("Error getting gif list:", error);
            return null;
        }
    }

    const fetchGifList = async () => {
        const gifs = await getGifList();
        setGifList(gifs);
    }


    // Renders
    const renderConnectWalletButton = () => (
        <button className="cta-button connect-wallet-button" onClick={() => connectPhantomWallet(true)}>
            Connect Phantom Wallet
        </button>
    )

    const renderConnectedContainer = () => (
        <div>
            <CandyMachine walletAddress={window.solana}/>
            {gifList === null ? renderInitialiseAccountButton() : renderGifPortal()}
        </div>
    )

    const renderInitialiseAccountButton = () => (
        <div className="connected-container">
            <button className="cta-button submit-gif-button" onClick={() => {
                createGifAccount().then(fetchGifList)
            }}>
                Create GIF Account
            </button>
        </div>
    )

    const renderGifPortal = () => (
        <div className="connected-container">
            <form onSubmit={(event) => {
                event.preventDefault();
                submitGif().then(fetchGifList);
            }}>
                <input required type="url" placeholder="Enter a F1-related GIF link! 🏎" value={inputValue}
                       onChange={onInputChange}/>
                <button type="submit" className="cta-button submit-gif-button">Submit</button>
            </form>
            {renderGifGrid()}
        </div>
    )

    const renderGifGrid = () => (
        <div className="gif-grid">
            {gifList && gifList.map((gif, index) => (
                <div className="gif-item" key={index}>
                    <img src={gif.gifLink} alt={gif.gifLink}/>
                </div>
            ))}
        </div>
    )


    // UseEffects
    useEffect(() => {
        const onload = async () => {
            await checkForPhantomWallet();
        };
        window.addEventListener('load', onload);
        return () => window.removeEventListener('load', onload);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            console.log("Fetching GIF list...");
            fetchGifList();
        }
    }, [walletAddress]);


    return (
        <div className="App">
            <div className={walletAddress ? "authed-container" : "container"}>
                <div className="header-container">
                    <p className="header">🖼 F1 GIF Portal 🏎</p>
                    <p className="sub-text">
                        View your F1 GIF collection in the metaverse ✨
                    </p>
                    {walletAddress ? renderConnectedContainer() : renderConnectWalletButton()}
                </div>
                <div className="footer-container">
                    <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo}/>
                    <a
                        className="footer-text"
                        href={TWITTER_LINK}
                        target="_blank"
                        rel="noreferrer"
                    >{`learned on @${TWITTER_HANDLE}`}</a>
                </div>
            </div>
        </div>
    );
};

export default App;
