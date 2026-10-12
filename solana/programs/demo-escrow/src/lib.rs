use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

// Generated build identity. Not deployed; never treat source presence as deployment evidence.
declare_id!("4PovBNQwgpgJyxXjtsdsUPWMu4bWrYnJt8dkmAuT4r2B");
const MAX_DEPOSIT: u64 = 1_000_000_000; // 1 test SOL; never a fiat quote.
const MAX_DURATION: i64 = 86_400;

#[program]
pub mod demo_escrow {
    use super::*;
    pub fn fund(ctx: Context<Fund>, demo_id: [u8; 32], amount: u64, expires_at: i64) -> Result<()> {
        require!(amount > 0 && amount <= MAX_DEPOSIT, EscrowError::InvalidAmount);
        require!(demo_id != [0; 32], EscrowError::InvalidId);
        let now = Clock::get()?.unix_timestamp;
        let duration = expires_at.checked_sub(now).ok_or(EscrowError::Arithmetic)?;
        require!(duration > 0 && duration <= MAX_DURATION, EscrowError::InvalidExpiry);
        require_keys_neq!(ctx.accounts.depositor.key(), ctx.accounts.provider.key(), EscrowError::InvalidRecipient);
        let escrow = &mut ctx.accounts.escrow;
        escrow.depositor = ctx.accounts.depositor.key();
        escrow.provider = ctx.accounts.provider.key();
        escrow.demo_id = demo_id;
        escrow.amount = amount;
        escrow.expires_at = expires_at;
        escrow.state = State::Funded;
        escrow.bump = ctx.bumps.escrow;
        transfer(CpiContext::new(ctx.accounts.system_program.key(), Transfer {
            from: ctx.accounts.depositor.to_account_info(), to: ctx.accounts.vault.to_account_info(),
        }), amount)?;
        Ok(())
    }
    pub fn release(ctx: Context<Release>) -> Result<()> {
        require!(ctx.accounts.escrow.state == State::Funded, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp < ctx.accounts.escrow.expires_at, EscrowError::Expired);
        pay(&ctx.accounts.vault.to_account_info(), &ctx.accounts.provider.to_account_info(), ctx.accounts.escrow.amount)?;
        ctx.accounts.escrow.state = State::Released;
        Ok(())
    }
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        require!(ctx.accounts.escrow.state == State::Funded, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp >= ctx.accounts.escrow.expires_at, EscrowError::NotExpired);
        pay(&ctx.accounts.vault.to_account_info(), &ctx.accounts.depositor.to_account_info(), ctx.accounts.escrow.amount)?;
        ctx.accounts.escrow.state = State::Refunded;
        Ok(())
    }
}

fn pay(from: &AccountInfo, to: &AccountInfo, amount: u64) -> Result<()> {
    require_keys_neq!(from.key(), to.key(), EscrowError::InvalidRecipient);
    let remaining = from.lamports().checked_sub(amount).ok_or(EscrowError::Arithmetic)?;
    require!(remaining >= Rent::get()?.minimum_balance(from.data_len()), EscrowError::InsufficientFunds);
    let received = to.lamports().checked_add(amount).ok_or(EscrowError::Arithmetic)?;
    **from.try_borrow_mut_lamports()? = remaining;
    **to.try_borrow_mut_lamports()? = received;
    Ok(())
}

#[derive(Accounts)]
#[instruction(demo_id: [u8; 32])]
pub struct Fund<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    pub provider: SystemAccount<'info>,
    #[account(init, payer = depositor, space = 8 + Escrow::INIT_SPACE,
        seeds = [b"demo-escrow", depositor.key().as_ref(), demo_id.as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(init, payer = depositor, space = 8,
        seeds = [b"demo-vault", escrow.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub provider: SystemAccount<'info>,
    #[account(mut, has_one = depositor, has_one = provider,
        seeds = [b"demo-escrow", depositor.key().as_ref(), escrow.demo_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, seeds = [b"demo-vault", escrow.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut, has_one = depositor,
        seeds = [b"demo-escrow", depositor.key().as_ref(), escrow.demo_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, seeds = [b"demo-vault", escrow.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
}

#[account]
pub struct Vault {}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub depositor: Pubkey,
    pub provider: Pubkey,
    pub demo_id: [u8; 32],
    pub amount: u64,
    pub expires_at: i64,
    pub state: State,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum State { Funded, Released, Refunded }

#[error_code]
pub enum EscrowError {
    #[msg("Invalid test amount")] InvalidAmount,
    #[msg("Invalid random demo ID")] InvalidId,
    #[msg("Invalid expiry")] InvalidExpiry,
    #[msg("Invalid recipient")] InvalidRecipient,
    #[msg("Invalid escrow state")] InvalidState,
    #[msg("Escrow expired")] Expired,
    #[msg("Escrow has not expired")] NotExpired,
    #[msg("Arithmetic rejected")] Arithmetic,
    #[msg("Insufficient escrow balance")] InsufficientFunds,
}


