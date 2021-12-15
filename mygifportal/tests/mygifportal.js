const anchor = require('@project-serum/anchor');

const { SystemProgram } = anchor.web3;

const main = async () => {
    console.log("🚀 Starting test...")

    // Configure the client to use the local cluster.
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Mygifportal;
    const baseAccount = anchor.web3.Keypair.generate();

    const tx = await program.rpc.initialise({
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
    });
    console.log("📝 Transaction signature:", tx);

    // Fetch data from the account
    let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('👀 GIF Count:', account.totalGifs.toString());

    await program.rpc.addGif("giphy link", {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
        }
    });
    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log("👀 GIF Count:", account.totalGifs.toString());
    console.log("👀 GIF List:", account.gifList);
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
};

runMain();
