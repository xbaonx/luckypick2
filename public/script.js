// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Change this to your backend URL

// Global State
let currentUser = null;
let currentMode = 'fun';
let selectedNumbers = [];
let gameHistory = [];
let withdrawHistory = [];

// DOM Elements
const elements = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    gameInterface: document.getElementById('gameInterface'),
    historySection: document.getElementById('historySection'),
    userInfo: document.getElementById('userInfo'),
    bottomNav: document.getElementById('bottomNav'),
    
    userIdInput: document.getElementById('userIdInput'),
    loginBtn: document.getElementById('loginBtn'),
    
    funBalance: document.getElementById('funBalance'),
    usdtBalance: document.getElementById('usdtBalance'),
    
    numberGrid: document.getElementById('numberGrid'),
    selectedList: document.getElementById('selectedList'),
    betAmount: document.getElementById('betAmount'),
    currencyLabel: document.getElementById('currencyLabel'),
    playBtn: document.getElementById('playBtn'),
    
    gameResult: document.getElementById('gameResult'),
    winningNumber: document.getElementById('winningNumber'),
    totalBet: document.getElementById('totalBet'),
    winAmount: document.getElementById('winAmount'),
    newBalance: document.getElementById('newBalance'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    
    withdrawBtn: document.getElementById('withdrawBtn'),
    withdrawModal: document.getElementById('withdrawModal'),
    withdrawAmount: document.getElementById('withdrawAmount'),
    withdrawAddress: document.getElementById('withdrawAddress'),
    confirmWithdraw: document.getElementById('confirmWithdraw'),
    
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    
    gameHistoryList: document.getElementById('gameHistoryList'),
    withdrawHistoryList: document.getElementById('withdrawHistoryList')
};

// API Functions
const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async register(userId) {
        return await this.request('/user/register', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    },

    async getUser(userId) {
        return await this.request(`/user/${userId}`);
    },

    async getBalance(userId) {
        return await this.request(`/user/balance/${userId}`);
    },

    async playGame(gameData) {
        return await this.request('/game/play', {
            method: 'POST',
            body: JSON.stringify(gameData)
        });
    },

    async getGameHistory(userId) {
        return await this.request(`/game/history/${userId}`);
    },

    async withdraw(withdrawData) {
        return await this.request('/withdraw', {
            method: 'POST',
            body: JSON.stringify(withdrawData)
        });
    },

    async getWithdrawHistory(userId) {
        return await this.request(`/withdraw/history/${userId}`);
    }
};

// Utility Functions
function showLoading(show = true) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatDate(date) {
    return new Date(date).toLocaleString('vi-VN');
}

// Initialize Number Grid
function initNumberGrid() {
    elements.numberGrid.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.className = 'number-cell';
        cell.textContent = i.toString().padStart(2, '0');
        cell.dataset.number = i.toString().padStart(2, '0');
        
        cell.addEventListener('click', () => {
            toggleNumber(cell.dataset.number);
        });
        
        elements.numberGrid.appendChild(cell);
    }
}

function toggleNumber(number) {
    const index = selectedNumbers.indexOf(number);
    const cell = document.querySelector(`.number-cell[data-number="${number}"]`);
    
    if (index > -1) {
        selectedNumbers.splice(index, 1);
        cell.classList.remove('selected');
    } else {
        if (selectedNumbers.length < 10) {
            selectedNumbers.push(number);
            cell.classList.add('selected');
        } else {
            showToast('Chỉ có thể chọn tối đa 10 số!', 'warning');
        }
    }
    
    updateSelectedList();
    updatePlayButton();
}

function removeNumber(number) {
    const index = selectedNumbers.indexOf(number);
    if (index > -1) {
        selectedNumbers.splice(index, 1);
        const cell = document.querySelector(`.number-cell[data-number="${number}"]`);
        cell.classList.remove('selected');
        updateSelectedList();
        updatePlayButton();
    }
}

function updateSelectedList() {
    if (selectedNumbers.length === 0) {
        elements.selectedList.innerHTML = '<p class="empty-state">Chưa chọn số nào</p>';
        return;
    }
    
    const items = selectedNumbers.map(number => `
        <div class="selected-item">
            <span>${number}</span>
            <i class="fas fa-times remove" onclick="removeNumber('${number}')"></i>
        </div>
    `).join('');
    
    elements.selectedList.innerHTML = items;
}

function updatePlayButton() {
    const canPlay = selectedNumbers.length > 0 && 
                   elements.betAmount.value > 0 && 
                   hasEnoughBalance();
    
    elements.playBtn.disabled = !canPlay;
}

function hasEnoughBalance() {
    const betAmount = parseFloat(elements.betAmount.value) || 0;
    const totalBet = betAmount * selectedNumbers.length;
    
    if (currentMode === 'fun') {
        return totalBet <= currentUser.balanceFun;
    } else {
        return totalBet <= currentUser.balanceUsdt;
    }
}

function updateBalanceDisplay() {
    if (currentUser) {
        elements.funBalance.textContent = formatNumber(currentUser.balanceFun);
        elements.usdtBalance.textContent = formatNumber(currentUser.balanceUsdt);
    }
}

function updateCurrencyLabel() {
    elements.currencyLabel.textContent = currentMode === 'fun' ? 'FUN' : 'USDT';
}

// Game Functions
async function playGame() {
    if (selectedNumbers.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 số!', 'warning');
        return;
    }

    const betAmount = parseFloat(elements.betAmount.value);
    if (!betAmount || betAmount <= 0) {
        showToast('Vui lòng nhập số tiền cược hợp lệ!', 'warning');
        return;
    }

    if (!hasEnoughBalance()) {
        showToast('Số dư không đủ để đặt cược!', 'error');
        return;
    }

    showLoading(true);

    try {
        const gameData = {
            userId: currentUser.userId,
            mode: currentMode,
            numbers: selectedNumbers,
            betAmounts: selectedNumbers.map(() => betAmount)
        };

        const result = await api.playGame(gameData);

        // Update user balance
        await updateUserBalance();

        // Show result
        showGameResult(result);
        
        // Clear selections
        clearSelections();

    } catch (error) {
        console.error('Play game error:', error);
        showToast('Có lỗi xảy ra khi chơi game!', 'error');
    } finally {
        showLoading(false);
    }
}

function showGameResult(result) {
    elements.winningNumber.textContent = result.result;
    elements.totalBet.textContent = formatNumber(result.totalBetAmount) + ' ' + (currentMode === 'fun' ? 'FUN' : 'USDT');
    elements.winAmount.textContent = formatNumber(result.winAmount) + ' ' + (currentMode === 'fun' ? 'FUN' : 'USDT');
    elements.newBalance.textContent = formatNumber(result.newBalance) + ' ' + (currentMode === 'fun' ? 'FUN' : 'USDT');
    
    elements.gameResult.style.display = 'flex';
    
    if (result.winAmount > 0) {
        showToast(`Chúc mừng! Bạn thắng ${formatNumber(result.winAmount)} ${currentMode === 'fun' ? 'FUN' : 'USDT'}!`, 'success');
    }
}

function clearSelections() {
    selectedNumbers = [];
    document.querySelectorAll('.number-cell.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    updateSelectedList();
    updatePlayButton();
}

async function updateUserBalance() {
    try {
        const balance = await api.getBalance(currentUser.userId);
        currentUser.balanceFun = balance.balanceFun;
        currentUser.balanceUsdt = balance.balanceUsdt;
        updateBalanceDisplay();
    } catch (error) {
        console.error('Update balance error:', error);
    }
}

// Authentication Functions
async function login() {
    const userId = elements.userIdInput.value.trim();
    
    if (!userId) {
        showToast('Vui lòng nhập User ID!', 'warning');
        return;
    }

    showLoading(true);

    try {
        // Try to get existing user first
        let user;
        try {
            user = await api.getUser(userId);
            showToast('Đăng nhập thành công!', 'success');
        } catch (error) {
            // User doesn't exist, register new user
            const registerResult = await api.register(userId);
            if (registerResult.success) {
                user = registerResult.user;
                showToast('Đăng ký thành công! Bạn được tặng 1000 FunCoin!', 'success');
            } else {
                throw new Error(registerResult.error || 'Registration failed');
            }
        }

        currentUser = user;
        showGameInterface();
        updateBalanceDisplay();

    } catch (error) {
        console.error('Login error:', error);
        showToast('Đăng nhập thất bại: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function showGameInterface() {
    elements.welcomeScreen.style.display = 'none';
    elements.gameInterface.style.display = 'block';
    elements.userInfo.style.display = 'flex';
    elements.bottomNav.style.display = 'flex';
}

// History Functions
async function loadGameHistory() {
    if (!currentUser) return;
    
    try {
        elements.gameHistoryList.innerHTML = '<div class="loading">Đang tải...</div>';
        
        const history = await api.getGameHistory(currentUser.userId);
        gameHistory = history;
        
        if (history.length === 0) {
            elements.gameHistoryList.innerHTML = '<div class="loading">Chưa có lịch sử game</div>';
            return;
        }
        
        const historyHtml = history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <h4>Game ${item.mode.toUpperCase()}</h4>
                    <p>Số chọn: ${item.bets.map(b => b.number).join(', ')}</p>
                    <p>Kết quả: ${item.result} • ${formatDate(item.timestamp)}</p>
                </div>
                <div class="history-amount">
                    <div class="amount ${item.winAmount > 0 ? 'win' : 'lose'}">
                        ${item.winAmount > 0 ? '+' : '-'}${formatNumber(Math.abs(item.winAmount || item.totalBetAmount))}
                    </div>
                    <div style="font-size: 0.8rem; color: #666;">
                        ${item.mode === 'fun' ? 'FUN' : 'USDT'}
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.gameHistoryList.innerHTML = historyHtml;
        
    } catch (error) {
        console.error('Load game history error:', error);
        elements.gameHistoryList.innerHTML = '<div class="loading">Lỗi tải dữ liệu</div>';
    }
}

async function loadWithdrawHistory() {
    if (!currentUser) return;
    
    try {
        elements.withdrawHistoryList.innerHTML = '<div class="loading">Đang tải...</div>';
        
        const history = await api.getWithdrawHistory(currentUser.userId);
        withdrawHistory = history;
        
        if (history.length === 0) {
            elements.withdrawHistoryList.innerHTML = '<div class="loading">Chưa có lịch sử rút tiền</div>';
            return;
        }
        
        const historyHtml = history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <h4>Rút tiền USDT</h4>
                    <p>Địa chỉ: ${item.toAddress.substring(0, 10)}...${item.toAddress.substring(item.toAddress.length - 10)}</p>
                    <p>Trạng thái: ${item.status === 'confirmed' ? 'Thành công' : item.status === 'pending' ? 'Đang xử lý' : 'Thất bại'} • ${formatDate(item.createdAt)}</p>
                </div>
                <div class="history-amount">
                    <div class="amount">
                        {formatNumber(item.amount)} USDT
                    </div>
                    <div style="font-size: 0.8rem; color: #666;">
                        ${item.status === 'confirmed' ? '✅' : item.status === 'pending' ? '⏳' : '❌'}
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.withdrawHistoryList.innerHTML = historyHtml;
        
    } catch (error) {
        console.error('Load withdraw history error:', error);
        elements.withdrawHistoryList.innerHTML = '<div class="loading">Lỗi tải dữ liệu</div>';
    }
}

// Withdraw Functions
async function processWithdraw() {
    const amount = parseFloat(elements.withdrawAmount.value);
    const address = elements.withdrawAddress.value.trim();
    
    if (!amount || amount <= 0) {
        showToast('Vui lòng nhập số tiền hợp lệ!', 'warning');
        return;
    }
    
    if (!address || !address.startsWith('0x') || address.length !== 42) {
        showToast('Địa chỉ ví không hợp lệ!', 'warning');
        return;
    }
    
    if (amount > currentUser.balanceUsdt) {
        showToast('Số dư USDT không đủ!', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await api.withdraw({
            userId: currentUser.userId,
            amount: amount,
            toAddress: address
        });
        
        if (result.success) {
            showToast('Yêu cầu rút tiền đã được gửi thành công!', 'success');
            elements.withdrawModal.style.display = 'none';
            
            // Reset form
            elements.withdrawAmount.value = '';
            elements.withdrawAddress.value = '';
            
            // Update balance
            await updateUserBalance();
            
            // Reload withdraw history
            if (elements.historySection.style.display !== 'none') {
                loadWithdrawHistory();
            }
        } else {
            showToast('Rút tiền thất bại: ' + result.error, 'error');
        }
        
    } catch (error) {
        console.error('Withdraw error:', error);
        showToast('Có lỗi xảy ra khi rút tiền!', 'error');
    } finally {
        showLoading(false);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    initNumberGrid();
    
    // Login
    elements.loginBtn.addEventListener('click', login);
    elements.userIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            updateCurrencyLabel();
            updatePlayButton();
        });
    });
    
    // Bet amount input
    elements.betAmount.addEventListener('input', updatePlayButton);
    
    // Play game
    elements.playBtn.addEventListener('click', playGame);
    
    // Play again
    elements.playAgainBtn.addEventListener('click', function() {
        elements.gameResult.style.display = 'none';
    });
    
    // Withdraw
    elements.withdrawBtn.addEventListener('click', function() {
        elements.withdrawModal.style.display = 'flex';
    });
    
    elements.confirmWithdraw.addEventListener('click', processWithdraw);
    
    // Modal close
    document.getElementById('closeWithdrawModal').addEventListener('click', function() {
        elements.withdrawModal.style.display = 'none';
    });
    
    document.getElementById('cancelWithdraw').addEventListener('click', function() {
        elements.withdrawModal.style.display = 'none';
    });
    
    // Close modal on backdrop click
    elements.withdrawModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    
    elements.gameResult.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (section === 'game') {
                elements.gameInterface.style.display = 'block';
                elements.historySection.style.display = 'none';
            } else if (section === 'history') {
                elements.gameInterface.style.display = 'none';
                elements.historySection.style.display = 'block';
                loadGameHistory();
                loadWithdrawHistory();
            }
        });
    });
    
    // History tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (tab === 'game') {
                document.getElementById('gameHistory').classList.add('active');
            } else if (tab === 'withdraw') {
                document.getElementById('withdrawHistory').classList.add('active');
            }
        });
    });
});

// Global functions for inline event handlers
window.removeNumber = removeNumber;
