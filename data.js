// ===== 天機數元 · 数据层 =====
// 支持多数据源 + 玄学算法所需字段

const TianjiData = {
    // 玄学系统所需数据
    xuanxue: {
        gann: { weight: 40, status: '待积累' },
        chan: { weight: 25, status: '待积累' },
        support: { weight: 20, status: '待积累' },
        harmonic: { weight: 15, status: '待积累' },
        fearGreed: 23,
        btcFee: -0.4293
    },
    
    // 币种数据
    coins: [
        { symbol: 'XAU', name: '黄金', price: 2925.43, change: 0.35, trend: 'up', signal: '观察池' },
        { symbol: 'XAG', name: '白银', price: 24.68, change: -0.12, trend: 'down', signal: '预备池' },
        { symbol: 'BTC', name: '比特币', price: 63452, change: 1.25, trend: 'up', signal: '已入场' },
        { symbol: 'ETH', name: '以太坊', price: 3125, change: 0.85, trend: 'up', signal: '观察池' },
        { symbol: 'SOL', name: 'Solana', price: 142.5, change: 2.15, trend: 'up', signal: '预备池' }
    ],
    
    // 获取数据（多源）
    async fetchData() {
        // 数据源列表
        const sources = [
            this.fetchFromStockTV,
            this.fetchFromAllTick,
            this.fetchFallback
        ];
        
        for (let source of sources) {
            try {
                const data = await source.call(this);
                if (data && data.length > 0) {
                    this.coins = data;
                    this.updateUI();
                    return data;
                }
            } catch (e) {
                console.log('数据源失败:', e);
            }
        }
    },
    
    // StockTV源
    async fetchFromStockTV() {
        const res = await fetch('https://api.stocktv.top/futures/market?key=test123456');
        const data = await res.json();
        return data.data.map(item => ({
            symbol: item.symbol,
            name: item.symbol === 'XAU' ? '黄金' : item.symbol,
            price: item.last,
            change: item.chgPct,
            trend: item.chgPct > 0 ? 'up' : 'down',
            signal: this.getSignal(item.symbol)
        }));
    },
    
    // 兜底数据
    fetchFallback() {
        return [
            { symbol: 'XAU', name: '黄金', price: 2925.43, change: 0.35, trend: 'up', signal: '观察池' },
            { symbol: 'XAG', name: '白银', price: 24.68, change: -0.12, trend: 'down', signal: '预备池' },
            { symbol: 'BTC', name: '比特币', price: 63452, change: 1.25, trend: 'up', signal: '已入场' }
        ];
    },
    
    // 根据玄学规则分配信号
    getSignal(symbol) {
        const signals = ['全部', '已入场', '预备池', '观察池', '已出局'];
        // 这里可以接入你的玄学算法
        return signals[Math.floor(Math.random() * signals.length)];
    },
    
    // 更新UI
    updateUI() {
        // 更新卡片数字
        document.getElementById('upCount').textContent = 
            this.coins.filter(c => c.trend === 'up').length;
        document.getElementById('downCount').textContent = 
            this.coins.filter(c => c.trend === 'down').length;
        
        // 更新列表
        const listEl = document.getElementById('resultList');
        listEl.innerHTML = this.coins.map(c => `
            <div class="result-item" data-symbol="${c.symbol}">
                <span class="name">${c.name} (${c.symbol})</span>
                <span class="price">$${c.price.toFixed(2)}</span>
                <span class="change ${c.trend}">${c.change > 0 ? '↑' : '↓'} ${Math.abs(c.change)}%</span>
                <span class="signal ${c.signal}">${c.signal}</span>
            </div>
        `).join('');
    },
    
    // 十法合一推演（调用你的玄学算法）
    yanji(coinSymbol) {
        // 这里调用你原有的玄学算法
        if (window.Xuanxue && window.Xuanxue.tenMethod) {
            return window.Xuanxue.tenMethod(coinSymbol);
        }
        return { result: '等待玄学算法...' };
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.tianji = TianjiData;
    
    // 绑定推演按钮
    document.getElementById('startYanji').addEventListener('click', () => {
        TianjiData.fetchData();
    });
    
    // 绑定列表点击（手动输入价格）
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.result-item');
        if (item) {
            const symbol = item.dataset.symbol;
            const price = prompt(`请输入 ${symbol} 价格:`);
            if (price) {
                // 调用玄学算法
                const result = TianjiData.yanji(symbol);
                alert(`推演结果：${JSON.stringify(result)}`);
            }
        }
    });
});