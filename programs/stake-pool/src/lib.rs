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

/// Cấu trúc dữ liệu lưu trữ thông tin của Stake Pool
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct StakePool {
    pub total_staked: u64,        // Tổng số SOL đã stake
    pub reward_rate: u64,         // Tỷ lệ lãi suất hàng năm (%)
    pub last_update_time: i64,    // Thời điểm cập nhật lãi cuối cùng
}

/// Các lệnh có thể thực hiện với Stake Pool
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum StakePoolInstruction {
    Initialize,                    // Khởi tạo stake pool
    Stake { amount: u64 },        // Stake SOL với số lượng cụ thể
    Unstake { amount: u64 },      // Rút SOL đã stake
    ClaimRewards,                 // Nhận lãi đã tích lũy
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
    let instruction = StakePoolInstruction::try_from_slice(instruction_data)?;

    // Xử lý từng loại lệnh
    match instruction {
        StakePoolInstruction::Initialize => {
            msg!("Instruction: Initialize");
            process_initialize(program_id, accounts)
        }
        StakePoolInstruction::Stake { amount } => {
            msg!("Instruction: Stake");
            process_stake(program_id, accounts, amount)
        }
        StakePoolInstruction::Unstake { amount } => {
            msg!("Instruction: Unstake");
            process_unstake(program_id, accounts, amount)
        }
        StakePoolInstruction::ClaimRewards => {
            msg!("Instruction: Claim Rewards");
            process_claim_rewards(program_id, accounts)
        }
    }
}

/// Khởi tạo Stake Pool mới
fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;

    // Kiểm tra quyền sở hữu tài khoản
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Tạo stake pool mới với các giá trị ban đầu
    let stake_pool = StakePool {
        total_staked: 0,          // Chưa có SOL nào được stake
        reward_rate: 5,           // Lãi suất 5% mỗi năm
        last_update_time: 0,      // Thời điểm bắt đầu
    };

    // Lưu dữ liệu vào tài khoản
    stake_pool.serialize(&mut *stake_pool_account.data.borrow_mut())?;
    Ok(())
}

/// Xử lý việc stake SOL
fn process_stake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,                  // Số lượng SOL muốn stake
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let mut stake_pool = StakePool::try_from_slice(&stake_pool_account.data.borrow())?;

    // Chuyển SOL từ người dùng vào stake pool
    invoke(
        &system_instruction::transfer(
            user_account.key,
            stake_pool_account.key,
            amount,
        ),
        &[user_account.clone(), stake_pool_account.clone()],
    )?;

    // Cập nhật tổng số SOL đã stake
    stake_pool.total_staked = stake_pool.total_staked.checked_add(amount)
        .ok_or(ProgramError::Overflow)?;

    // Lưu trạng thái mới
    stake_pool.serialize(&mut *stake_pool_account.data.borrow_mut())?;
    Ok(())
}

/// Xử lý việc rút SOL đã stake
fn process_unstake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,                  // Số lượng SOL muốn rút
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let stake_pool_account = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let mut stake_pool = StakePool::try_from_slice(&stake_pool_account.data.borrow())?;

    // Kiểm tra số dư đủ
    if stake_pool.total_staked < amount {
        return Err(ProgramError::InsufficientFunds);
    }

    // Chuyển SOL từ stake pool về người dùng
    **stake_pool_account.try_borrow_mut_lamports()? -= amount;
    **user_account.try_borrow_mut_lamports()? += amount;

    // Cập nhật tổng số SOL đã stake
    stake_pool.total_staked = stake_pool.total_staked.checked_sub(amount)
        .ok_or(ProgramError::Overflow)?;

    // Lưu trạng thái mới
    stake_pool.serialize(&mut *stake_pool_account.data.borrow_mut())?;
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

    // Kiểm tra quyền sở hữu
    if stake_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Đọc thông tin stake pool hiện tại
    let mut stake_pool = StakePool::try_from_slice(&stake_pool_account.data.borrow())?;

    // Lấy thời gian hiện tại
    let current_time = solana_program::clock::Clock::get()?.unix_timestamp;
    // Tính thời gian đã trôi qua
    let time_elapsed = current_time.checked_sub(stake_pool.last_update_time)
        .ok_or(ProgramError::Overflow)?;

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
    stake_pool.serialize(&mut *stake_pool_account.data.borrow_mut())?;
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
