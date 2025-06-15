use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    program::{invoke, invoke_signed},
    sysvar::{rent::Rent, Sysvar},
};
use borsh::{BorshDeserialize, BorshSerialize};
use spl_token::state::Account as TokenAccount;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Cấu trúc dữ liệu lưu trữ thông tin của Stake Pool
#[derive(Debug)]
pub struct StakePool {
    pub total_staked: u64,        // Tổng số SOL đã stake
    pub total_msol: u64,          // Tổng số mSOL đã mint
    pub reward_rate: u64,         // Tỷ lệ lãi suất hàng năm (%)
    pub last_update_time: i64,    // Thời điểm cập nhật lãi cuối cùng
    pub authority: Pubkey,
    pub msol_mint: Pubkey,        // Địa chỉ của mSOL token mint
    pub linked_cards: std::collections::BTreeMap<Pubkey, CardInfo>,
}

impl StakePool {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 32 + 32 + 1000; // u64 + u64 + u64 + i64 + 32 bytes for authority + 32 bytes for msol_mint + 1000 bytes for linked_cards

    pub fn new() -> Self {
        Self {
            total_staked: 0,
            total_msol: 0,
            reward_rate: 5,
            last_update_time: 0,
            authority: Pubkey::default(),
            msol_mint: Pubkey::default(),
            linked_cards: std::collections::BTreeMap::new(),
        }
    }

    pub fn serialize(&self, data: &mut [u8]) -> ProgramResult {
        if data.len() < Self::LEN {
            return Err(ProgramError::AccountDataTooSmall);
        }

        // Serialize total_staked (u64)
        data[0..8].copy_from_slice(&self.total_staked.to_le_bytes());
        // Serialize total_msol (u64)
        data[8..16].copy_from_slice(&self.total_msol.to_le_bytes());
        // Serialize reward_rate (u64)
        data[16..24].copy_from_slice(&self.reward_rate.to_le_bytes());
        // Serialize last_update_time (i64)
        data[24..32].copy_from_slice(&self.last_update_time.to_le_bytes());
        // Serialize authority (Pubkey)
        data[32..64].copy_from_slice(&self.authority.to_bytes());
        // Serialize msol_mint (Pubkey)
        data[64..96].copy_from_slice(&self.msol_mint.to_bytes());
        // Serialize linked_cards (BTreeMap<Pubkey, CardInfo>)
        for (key, card_info) in &self.linked_cards {
            data[96..128].copy_from_slice(&key.to_bytes());
            card_info.serialize(&mut data[128..])?;
        }

        Ok(())
    }

    pub fn deserialize(data: &[u8]) -> Result<Self, ProgramError> {
        if data.len() < Self::LEN {
            return Err(ProgramError::AccountDataTooSmall);
        }

        let total_staked = u64::from_le_bytes(data[0..8].try_into().unwrap());
        let total_msol = u64::from_le_bytes(data[8..16].try_into().unwrap());
        let reward_rate = u64::from_le_bytes(data[16..24].try_into().unwrap());
        let last_update_time = i64::from_le_bytes(data[24..32].try_into().unwrap());
        let authority = Pubkey::from_bytes(data[32..64].try_into().unwrap());
        let msol_mint = Pubkey::from_bytes(data[64..96].try_into().unwrap());
        let mut linked_cards = std::collections::BTreeMap::new();
        let mut offset = 96;
        while offset < data.len() {
            let key = Pubkey::from_bytes(data[offset..offset+32].try_into().unwrap());
            let card_info = CardInfo::deserialize(&data[offset+32..])?;
            linked_cards.insert(key, card_info);
            offset += 32 + card_info.len();
        }

        Ok(Self {
            total_staked,
            total_msol,
            reward_rate,
            last_update_time,
            authority,
            msol_mint,
            linked_cards,
        })
    }
}

/// Các lệnh có thể thực hiện với Stake Pool
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum StakePoolInstruction {
    Initialize { msol_mint: Pubkey },  // Khởi tạo stake pool với mSOL mint
    Stake { amount: u64 },            // Stake SOL và nhận mSOL
    Unstake { amount: u64 },          // Rút SOL bằng cách burn mSOL
    ClaimRewards,                     // Nhận lãi đã tích lũy
    LinkCard { card_id: String },     // Liên kết thẻ tín dụng
    UnlinkCard { card_id: String },   // Bỏ liên kết thẻ tín dụng
    ProcessBNPL { amount: u64 },      // Xử lý giao dịch BNPL
}

// Đánh dấu điểm vào của chương trình
entrypoint!(process_instruction);

/// Hàm xử lý chính của chương trình
pub fn process_instruction(
    program_id: &Pubkey,          // ID của chương trình
    accounts: &[AccountInfo],      // Danh sách tài khoản liên quan
    instruction_data: &[u8],       // Dữ liệu lệnh
) -> ProgramResult {
    // Phân tích lệnh từ dữ liệu đầu vào
    if instruction_data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction = instruction_data[0];
    let amount = if instruction_data.len() > 1 {
        let mut amount_bytes = [0u8; 8];
        amount_bytes.copy_from_slice(&instruction_data[1..9]);
        u64::from_le_bytes(amount_bytes)
    } else {
        0
    };

    // Xử lý từng loại lệnh
    match instruction {
        0 => {
            msg!("Instruction: Initialize");
            let msol_mint = if instruction_data.len() > 9 {
                Pubkey::new(&instruction_data[9..41])
            } else {
                return Err(ProgramError::InvalidInstructionData);
            };
            process_initialize(program_id, accounts, msol_mint)
        }
        1 => {
            msg!("Instruction: Stake");
            process_stake(program_id, accounts, amount)
        }
        2 => {
            msg!("Instruction: Unstake");
            process_unstake(program_id, accounts, amount)
        }
        3 => {
            msg!("Instruction: Claim Rewards");
            process_claim_rewards(program_id, accounts)
        }
        4 => {
            msg!("Instruction: Link Card");
            process_link_card(program_id, accounts, amount)
        }
        5 => {
            msg!("Instruction: Unlink Card");
            process_unlink_card(program_id, accounts, amount)
        }
        6 => {
            msg!("Instruction: Process BNPL");
            process_bnpl_transaction(program_id, accounts, amount)
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

/// Tìm PDA cho stake pool
pub fn find_stake_pool_address(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"stake_pool"], program_id)
}

/// Khởi tạo Stake Pool mới
fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    msol_mint: Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let authority_account = next_account_info(account_info_iter)?;

    // Kiểm tra xem đây có phải là PDA của stake pool không
    let (expected_stake_pool, _) = find_stake_pool_address(program_id);
    if stake_pool_account.key != &expected_stake_pool {
        return Err(ProgramError::InvalidAccountData);
    }

    // Kiểm tra quyền sở hữu tài khoản
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Kiểm tra quyền của authority
    if !authority_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Tạo stake pool mới với các giá trị ban đầu
    let mut stake_pool = StakePool::new();
    stake_pool.authority = *authority_account.key;
    stake_pool.msol_mint = msol_mint;

    // Lưu dữ liệu vào tài khoản
    let mut data = stake_pool_account.data.borrow_mut();
    stake_pool.serialize(&mut data)?;
    Ok(())
}

/// Xử lý việc stake SOL và mint mSOL
fn process_stake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,                  // Số lượng SOL muốn stake
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;
    let msol_mint_account = next_account_info(account_info_iter)?;
    let user_msol_account = next_account_info(account_info_iter)?;
    let pool_msol_account = next_account_info(account_info_iter)?;

    // Kiểm tra xem đây có phải là PDA của stake pool không
    let (expected_stake_pool, _) = find_stake_pool_address(program_id);
    if stake_pool_account.key != &expected_stake_pool {
        return Err(ProgramError::InvalidAccountData);
    }

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let data = stake_pool_account.data.borrow();
    let mut stake_pool = StakePool::deserialize(&data)?;

    // Kiểm tra mSOL mint
    if msol_mint_account.key != &stake_pool.msol_mint {
        return Err(ProgramError::InvalidAccountData);
    }

    // Chuyển SOL từ người dùng vào stake pool
    invoke(
        &system_instruction::transfer(
            user_account.key,
            stake_pool_account.key,
            amount,
        ),
        &[user_account.clone(), stake_pool_account.clone()],
    )?;

    // Tính số lượng mSOL cần mint (1:1 với SOL)
    let msol_amount = amount;

    // Mint mSOL cho người dùng
    invoke(
        &spl_token::instruction::mint_to(
            &spl_token::id(),
            msol_mint_account.key,
            user_msol_account.key,
            stake_pool_account.key,
            &[],
            msol_amount,
        )?,
        &[
            msol_mint_account.clone(),
            user_msol_account.clone(),
            stake_pool_account.clone(),
        ],
    )?;

    // Cập nhật tổng số SOL đã stake và mSOL đã mint
    stake_pool.total_staked = stake_pool.total_staked.checked_add(amount)
        .ok_or(ProgramError::Custom(0))?;
    stake_pool.total_msol = stake_pool.total_msol.checked_add(msol_amount)
        .ok_or(ProgramError::Custom(0))?;

    // Lưu trạng thái mới
    let mut data = stake_pool_account.data.borrow_mut();
    stake_pool.serialize(&mut data)?;
    Ok(())
}

/// Xử lý việc rút SOL bằng cách burn mSOL
fn process_unstake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,                  // Số lượng mSOL muốn burn để rút SOL
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;
    let msol_mint_account = next_account_info(account_info_iter)?;
    let user_msol_account = next_account_info(account_info_iter)?;

    // Kiểm tra xem đây có phải là PDA của stake pool không
    let (expected_stake_pool, _) = find_stake_pool_address(program_id);
    if stake_pool_account.key != &expected_stake_pool {
        return Err(ProgramError::InvalidAccountData);
    }

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let data = stake_pool_account.data.borrow();
    let mut stake_pool = StakePool::deserialize(&data)?;

    // Kiểm tra mSOL mint
    if msol_mint_account.key != &stake_pool.msol_mint {
        return Err(ProgramError::InvalidAccountData);
    }

    // Burn mSOL từ người dùng
    invoke(
        &spl_token::instruction::burn(
            &spl_token::id(),
            user_msol_account.key,
            msol_mint_account.key,
            user_account.key,
            &[],
            amount,
        )?,
        &[
            user_msol_account.clone(),
            msol_mint_account.clone(),
            user_account.clone(),
        ],
    )?;

    // Chuyển SOL từ stake pool về cho người dùng
    invoke(
        &system_instruction::transfer(
            stake_pool_account.key,
            user_account.key,
            amount,
        ),
        &[stake_pool_account.clone(), user_account.clone()],
    )?;

    // Cập nhật tổng số SOL đã stake và mSOL đã mint
    stake_pool.total_staked = stake_pool.total_staked.checked_sub(amount)
        .ok_or(ProgramError::Custom(0))?;
    stake_pool.total_msol = stake_pool.total_msol.checked_sub(amount)
        .ok_or(ProgramError::Custom(0))?;

    // Lưu trạng thái mới
    let mut data = stake_pool_account.data.borrow_mut();
    stake_pool.serialize(&mut data)?;
    Ok(())
}

/// Xử lý việc nhận lãi
fn process_claim_rewards(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;

    // Kiểm tra xem đây có phải là PDA của stake pool không
    let (expected_stake_pool, _) = find_stake_pool_address(program_id);
    if stake_pool_account.key != &expected_stake_pool {
        return Err(ProgramError::InvalidAccountData);
    }

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let data = stake_pool_account.data.borrow();
    let mut stake_pool = StakePool::deserialize(&data)?;

    // Lấy thời gian hiện tại
    let current_time = solana_program::clock::Clock::get()?.unix_timestamp;
    // Tính thời gian đã trôi qua
    let time_elapsed = current_time.checked_sub(stake_pool.last_update_time)
        .ok_or(ProgramError::Custom(0))?;

    // Tính lãi
    let rewards = calculate_rewards(stake_pool.total_staked, time_elapsed, stake_pool.reward_rate)?;

    // Nếu có lãi, chuyển cho người dùng
    if rewards > 0 {
        **stake_pool_account.try_borrow_mut_lamports()? -= rewards;
        **user_account.try_borrow_mut_lamports()? += rewards;
    }

    // Cập nhật thời gian tính lãi cuối cùng
    stake_pool.last_update_time = current_time;
    // Lưu trạng thái mới
    let mut data = stake_pool_account.data.borrow_mut();
    stake_pool.serialize(&mut data)?;
    Ok(())
}

/// Tính lãi dựa trên số SOL đã stake, thời gian và tỷ lệ lãi
fn calculate_rewards(
    total_staked: u64,            // Tổng số SOL đã stake
    time_elapsed: i64,            // Thời gian đã trôi qua (giây)
    reward_rate: u64,             // Tỷ lệ lãi suất (%)
) -> Result<u64, ProgramError> {
    // Chuyển tỷ lệ lãi từ phần trăm sang thập phân (ví dụ: 5% -> 0.05)
    let reward_rate_decimal = reward_rate as f64 / 100.0;

    // Tính lãi: gốc * lãi suất * thời gian
    // Thời gian tính bằng giây, chia cho số giây trong năm
    let seconds_in_year = 31_536_000.0;
    let rewards = (total_staked as f64 * reward_rate_decimal * time_elapsed as f64) / seconds_in_year;

    Ok(rewards as u64)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + StakePool::LEN)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStake::LEN
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LinkCard<'info> {
    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UnlinkCard<'info> {
    #[account(mut)]
    pub stake_pool: Account<'info, StakePool>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ProcessBNPL<'info> {
    pub stake_pool: Account<'info, StakePool>,
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct UserStake {
    pub user: Pubkey,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CardInfo {
    pub card_id: String,
    pub status: CardStatus,
    pub linked_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum CardStatus {
    Linked,
    Unlinked,
}

#[error_code]
pub enum StakePoolError {
    #[msg("No stake found for user")]
    NoStakeFound,
    #[msg("No linked credit card found")]
    NoLinkedCard,
    #[msg("Transaction amount exceeds credit limit")]
    ExceedsCreditLimit,
}

impl UserStake {
    pub const LEN: usize = 32 + 8;
}
