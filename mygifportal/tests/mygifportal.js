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
    console.log('👀 GIF Count:', account.gifList.length);

    // Test add gif functionality
    await program.rpc.addGif("giphy link", {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        }
    });
    await program.rpc.addGif("hehe", {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        }
    });
    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('👀 GIF Count:', account.gifList.length);
    console.log("🗂 GIF List:", account.gifList, "\n");

    // Test upvote gif functionality
    await program.rpc.upvoteGif("giphy link", {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        }
    });
    await program.rpc.upvoteGif("giphy link", {
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
        }
    });
    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('👀 GIF Count:', account.gifList.length);
    console.log("🗂 GIF List:", account.gifList, "\n");

    // Test tipping functionality
    // console.log("💰", provider.wallet.);
    // await program.rpc.sendTip(1000, {
    //     accounts: {
    //         sender: provider.wallet.publicKey,
    //         receiver: provider.wallet.publicKey,
    //         systemProgram: SystemProgram.programId,
    //     }
    // })
    // account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    // console.log('👀 GIF Count:', account.gifList.length, "\n");
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
