use anchor_lang::prelude::*;

declare_id!("8D4EYepS4tfFvy8SJL2WiyigoaaEHQx6BHp3SJGqxHD9");

#[program]
pub mod mygifportal {
    use super::*;

    pub fn initialise(ctx: Context<Initialise>) -> ProgramResult {
        // Get a mutable reference to the base account
        let base_account = &mut ctx.accounts.base_account;

        // Initialise total_gifs
        base_account.total_gifs = 0;
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let gif = GifInfo {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
        };

        base_account.gif_list.push(gif);
        base_account.total_gifs += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialise<'info> {
    // Tell Solana how we want to initialise BaseAccount
    #[account(init, payer=user, space=4000)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    // Proves to the program that the user calling this program actually owns their wallet account
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    pub user: Signer<'info>
}

// Tell Solana what we want to store on this account
#[account]
pub struct BaseAccount {
    pub total_gifs: u64,
    pub gif_list: Vec<GifInfo>
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GifInfo {
    pub gif_link: String,
    pub user_address: Pubkey
}
