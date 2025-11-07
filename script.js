// 数据存储
let data = {
    wechatChats: [],
    tweets: [],
    worldBooks: [],
    presets: [],
    settings: {
        apiUrl: '',
        apiKey: ''
    },
    theme: {
        bgImage: '',
        themeColor: '#007bff'
    },
    renderRules: '',
    currentChat: null
};

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateTime();
    setInterval(updateTime, 1000);
    initializeDefaultData();
    applyTheme();
});

// 更新时间
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    
    document.getElementById('year-month-day').textContent = `${year}年${month}月${day}日`;
    document.getElementById('weekday').textContent = weekday;
}

// 屏幕切换
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function backToHome() {
    showScreen('home-screen');
}

function backToWechat() {
    showScreen('wechat-screen');
}

// 打开应用
function openApp(appName) {
    switch(appName) {
        case 'wechat':
            showScreen('wechat-screen');
            renderWechatList();
            break;
        case 'x':
            showScreen('x-screen');
            renderTweets();
            break;
        case 'games':
            showScreen('games-screen');
            break;
        case 'settings':
            showScreen('settings-screen');
            loadSettings();
            break;
        case 'theme':
            showScreen('theme-screen');
            loadThemeSettings();
            break;
        case 'worldbook':
            showScreen('worldbook-screen');
            renderWorldBooks();
            break;
        case 'preset':
            showScreen('preset-screen');
            renderPresets();
            break;
        case 'renderer':
            showScreen('renderer-screen');
            loadRenderRules();
            break;
        case 'cphone':
            alert('CPhone v1.0\n基于Web的手机模拟器');
            break;
    }
}

// 微信功能
function renderWechatList() {
    const container = document.getElementById('wechat-chat-list');
    if (data.wechatChats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">暂无聊天</p>';
        return;
    }
    
    container.innerHTML = data.wechatChats.map((chat, index) => `
        <div class="chat-item" onclick="openWechatConversation(${index})">
            <div class="avatar"></div>
            <div class="info">
                <div class="name">${chat.name}</div>
                <div class="last-message">${chat.messages[chat.messages.length - 1]?.text || '开始聊天...'}</div>
            </div>
        </div>
    `).join('');
}

function addWechatChat() {
    const name = prompt('请输入聊天名称:');
    if (name && name.trim()) {
        data.wechatChats.push({
            name: name.trim(),
            messages: []
        });
        saveData();
        renderWechatList();
    }
}

function openWechatConversation(index) {
    data.currentChat = index;
    const chat = data.wechatChats[index];
    document.getElementById('conversation-name').textContent = chat.name;
    showScreen('wechat-conversation-screen');
    renderMessages();
}

function renderMessages() {
    const container = document.getElementById('conversation-messages');
    const chat = data.wechatChats[data.currentChat];
    
    if (!chat || chat.messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">暂无消息</p>';
        return;
    }
    
    container.innerHTML = chat.messages.map(msg => `
        <div class="message-item ${msg.type}">
            ${msg.type === 'other' ? '<div class="avatar"></div>' : ''}
            <div class="message-bubble">${msg.text}</div>
            ${msg.type === 'user' ? '<div class="avatar"></div>' : ''}
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const chat = data.wechatChats[data.currentChat];
    chat.messages.push({
        type: 'user',
        text: text
    });
    
    input.value = '';
    saveData();
    renderMessages();
    
    // 模拟对方回复
    setTimeout(() => {
        chat.messages.push({
            type: 'other',
            text: '收到消息: ' + text
        });
        saveData();
        renderMessages();
    }, 1000);
}

// X社交功能
function renderTweets() {
    const container = document.getElementById('x-feed');
    if (data.tweets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">暂无推文</p>';
        return;
    }
    
    container.innerHTML = data.tweets.map(tweet => `
        <div class="tweet-item">
            <div class="tweet-header">
                <div class="tweet-avatar"></div>
                <div class="tweet-username">${tweet.username}</div>
            </div>
            <div class="tweet-content">${tweet.content}</div>
            <div class="tweet-actions">
                <span>💬 ${tweet.comments || 0}</span>
                <span>❤️ ${tweet.likes || 0}</span>
                <span>🔄 ${tweet.retweets || 0}</span>
            </div>
        </div>
    `).join('');
}

function postTweet() {
    const content = prompt('发布推文:');
    if (content && content.trim()) {
        data.tweets.unshift({
            username: '我',
            content: content.trim(),
            comments: 0,
            likes: 0,
            retweets: 0
        });
        saveData();
        renderTweets();
    }
}

// 游戏功能
function openGame(gameName) {
    let message = '';
    switch(gameName) {
        case 'werewolf':
            message = '狼人杀游戏开发中...\n敬请期待!';
            break;
        case 'turtle-soup':
            message = '海龟汤游戏开发中...\n敬请期待!';
            break;
        case 'guess':
            message = '你说我猜游戏开发中...\n敬请期待!';
            break;
    }
    alert(message);
}

// 设置功能
function loadSettings() {
    document.getElementById('api-url').value = data.settings.apiUrl || '';
    document.getElementById('api-key').value = data.settings.apiKey || '';
}

function saveSettings() {
    data.settings.apiUrl = document.getElementById('api-url').value;
    data.settings.apiKey = document.getElementById('api-key').value;
    saveData();
    alert('设置已保存!');
}

// 主题功能
function loadThemeSettings() {
    document.getElementById('theme-color').value = data.theme.themeColor || '#007bff';
}

function uploadBackground() {
    const file = document.getElementById('bg-upload').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            data.theme.bgImage = e.target.result;
            saveData();
            applyTheme();
        };
        reader.readAsDataURL(file);
    }
}

function changeThemeColor() {
    data.theme.themeColor = document.getElementById('theme-color').value;
    applyTheme();
}

function saveTheme() {
    saveData();
    alert('主题已保存!');
}

function applyTheme() {
    const phoneScreen = document.getElementById('phone-screen');
    if (data.theme.bgImage) {
        phoneScreen.style.backgroundImage = `url(${data.theme.bgImage})`;
    }
    if (data.theme.themeColor) {
        document.documentElement.style.setProperty('--primary-color', data.theme.themeColor);
    }
}

// 世界书功能
function renderWorldBooks() {
    const container = document.getElementById('worldbook-list');
    if (data.worldBooks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">暂无世界书</p>';
        return;
    }
    
    container.innerHTML = data.worldBooks.map((book, index) => `
        <div class="list-item" onclick="editWorldBook(${index})">
            <div class="title">${book.name}</div>
            <div class="description">${book.description || '暂无描述'}</div>
        </div>
    `).join('');
}

function addWorldBook() {
    const name = prompt('请输入世界书名称:');
    if (name && name.trim()) {
        const description = prompt('请输入世界书描述:');
        data.worldBooks.push({
            name: name.trim(),
            description: description ? description.trim() : ''
        });
        saveData();
        renderWorldBooks();
    }
}

function editWorldBook(index) {
    const book = data.worldBooks[index];
    const newName = prompt('编辑名称:', book.name);
    if (newName) {
        book.name = newName.trim();
        const newDesc = prompt('编辑描述:', book.description);
        if (newDesc !== null) {
            book.description = newDesc.trim();
        }
        saveData();
        renderWorldBooks();
    }
}

// 预设功能
function renderPresets() {
    const container = document.getElementById('preset-list');
    if (data.presets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-top: 50px;">暂无预设</p>';
        return;
    }
    
    container.innerHTML = data.presets.map((preset, index) => `
        <div class="list-item" onclick="editPreset(${index})">
            <div class="title">${preset.name}</div>
            <div class="description">${preset.content || '暂无内容'}</div>
        </div>
    `).join('');
}

function addPreset() {
    const name = prompt('请输入预设名称:');
    if (name && name.trim()) {
        const content = prompt('请输入预设内容:');
        data.presets.push({
            name: name.trim(),
            content: content ? content.trim() : ''
        });
        saveData();
        renderPresets();
    }
}

function editPreset(index) {
    const preset = data.presets[index];
    const newName = prompt('编辑名称:', preset.name);
    if (newName) {
        preset.name = newName.trim();
        const newContent = prompt('编辑内容:', preset.content);
        if (newContent !== null) {
            preset.content = newContent.trim();
        }
        saveData();
        renderPresets();
    }
}

// 渲染器功能
function loadRenderRules() {
    document.getElementById('render-rules').value = data.renderRules || '';
}

function saveRenderRules() {
    data.renderRules = document.getElementById('render-rules').value;
    saveData();
    alert('渲染规则已保存!');
}

// 数据持久化
function saveData() {
    localStorage.setItem('cphone-data', JSON.stringify(data));
}

function loadData() {
    const saved = localStorage.getItem('cphone-data');
    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load data:', e);
        }
    }
}

// 初始化默认数据
function initializeDefaultData() {
    if (data.wechatChats.length === 0) {
        data.wechatChats = [
            {
                name: 'AI助手',
                messages: [
                    { type: 'other', text: '你好!我是AI助手,有什么可以帮你的吗?' }
                ]
            }
        ];
    }
    
    if (data.tweets.length === 0) {
        data.tweets = [
            {
                username: 'CPhone官方',
                content: '欢迎使用CPhone! 这是一个基于Web的手机模拟器。',
                comments: 10,
                likes: 50,
                retweets: 20
            }
        ];
    }
    
    if (data.worldBooks.length === 0) {
        data.worldBooks = [
            {
                name: '示例世界书',
                description: '这是一个示例世界书,用于存储世界观设定'
            }
        ];
    }
    
    if (data.presets.length === 0) {
        data.presets = [
            {
                name: '示例预设',
                content: '这是一个示例预设,用于快速配置'
            }
        ];
    }
    
    saveData();
}

// 键盘事件
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen && activeScreen.id === 'wechat-conversation-screen') {
            sendMessage();
        }
    }
});
