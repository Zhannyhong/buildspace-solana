use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    system_instruction::transfer,
    program::invoke
};

declare_id!("494g856aNoMPdqu4n6KMwmLKfPTfxn3FtMwVqhZrvHuC");

#[program]
pub mod mygifportal {
    use super::*;

    pub fn initialise(_ctx: Context<Initialise>) -> ProgramResult {
        Ok(())
    }

    pub fn add_gif(ctx: Context<AddGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // Validate gif link
        let gif_link = gif_link.trim();
        if gif_link.is_empty() {  // TODO: ensure that gif link is of a proper url format too
            return Err(CustomError::InvalidGifLink.into());
        }

        // Ensure that the gif link has not been added before
        for gif in &base_account.gif_list {
            if gif.gif_link == gif_link {
                return Err(CustomError::GifLinkAlreadyExists.into());
            }
        }

        let gif = GifInfo {
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
            up_voters: Vec::new(),
        };

        base_account.gif_list.push(gif);
        Ok(())
    }

    pub fn upvote_gif(ctx: Context<UpvoteGif>, gif_link: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        for gif in base_account.gif_list.iter_mut() {
            if gif.gif_link == gif_link {
                gif.up_voters.push(*user.to_account_info().key);
                return Ok(())
            }
        };

        Err(CustomError::GifLinkNotFound.into())
    }

    pub fn send_tip(ctx: Context<SendTip>, amt_lamports: u64) -> ProgramResult {
        let sender = &ctx.accounts.sender;
        let receiver = &ctx.accounts.receiver;

        let instruction = transfer(
            &sender.key(),
            &receiver.key(),
            amt_lamports,
        );

        invoke(
            &instruction,
            &[sender.to_account_info(), receiver.to_account_info()],
        )
    }
}

#[derive(Accounts)]
pub struct Initialise<'info> {
    #[account(init, payer=user, space=10000)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    // Proves to the program that the user calling this program actually owns their wallet account
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpvoteGif<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct SendTip<'info> {
    #[account(mut)]
    pub sender: AccountInfo<'info>,

    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

// Tell Solana what we want to store on this account
#[account]
pub struct BaseAccount {
    pub gif_list: Vec<GifInfo>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct GifInfo {
    pub gif_link: String,
    pub user_address: Pubkey,
    pub up_voters: Vec<Pubkey>,
}

#[error]
pub enum CustomError {
    #[msg("Gif link provided is invalid!")]
    InvalidGifLink,

    #[msg("Gif link already exists!")]
    GifLinkAlreadyExists,

    #[msg("Gif link does not exist!")]
    GifLinkNotFound,
}
