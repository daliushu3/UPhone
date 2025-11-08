// 数据存储
let data = {
    wechatChats: [],
    tweets: [],
    worldBooks: [],
    presets: [],
    settings: {
        apiUrl: '',
        apiKey: '',
        apiModel: 'gpt-4',
        apiTemperature: 0.7,
        apiMaxTokens: 2000,
        summaryApiUrl: '',
        summaryModel: 'gpt-4',
        imageApiUrl: '',
        imageModel: 'dall-e-3',
        ttsApiUrl: '',
        ttsVoice: 'alloy'
    },
    theme: {
        bgImage: '',
        themeColor: '#007bff'
    },
    renderRules: '',
    currentChat: null
};

// AI角色预设
const aiRoles = {
    '': {
        name: '默认助手',
        prompt: '你是一个友好的AI助手，请帮助用户回答问题。'
    },
    'translator': {
        name: '翻译官',
        prompt: '你是一个专业的翻译官，请帮助用户翻译各种语言，提供准确流畅的翻译。'
    },
    'writer': {
        name: '作家',
        prompt: '你是一位创意作家，擅长写作各种风格的文章，包括小说、散文、诗歌等。'
    },
    'teacher': {
        name: '老师',
        prompt: '你是一位有耐心的老师，善于解释复杂的概念，用通俗易懂的语言帮助学生学习。'
    },
    'friend': {
        name: '朋友',
        prompt: '你是用户的好朋友，可以随意聊天，分享想法和感受。'
    }
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

function backToConversation() {
    showScreen('wechat-conversation-screen');
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
            alert('CPhone v2.0\\n增强版AI聊天手机模拟器\\n支持多API配置、角色扮演、对话管理等功能');
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
            messages: [],
            role: '',
            customPrompt: '',
            tokenCount: 0
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
    
    container.innerHTML = chat.messages.map(msg => {
        const timestamp = msg.timestamp ? `<div class="timestamp">${formatTime(msg.timestamp)}</div>` : '';
        
        if (msg.messageType === 'image') {
            return `
                ${timestamp}
                <div class="message-item image ${msg.type}">
                    ${msg.type === 'other' ? '<div class="avatar"></div>' : ''}
                    <div class="message-bubble">
                        <img src="${msg.imageUrl}" alt="图片">
                    </div>
                    ${msg.type === 'user' ? '<div class="avatar"></div>' : ''}
                </div>
            `;
        } else if (msg.messageType === 'location') {
            return `
                ${timestamp}
                <div class="message-item location ${msg.type}">
                    ${msg.type === 'other' ? '<div class="avatar"></div>' : ''}
                    <div class="message-bubble">
                        📍 ${msg.text}
                    </div>
                    ${msg.type === 'user' ? '<div class="avatar"></div>' : ''}
                </div>
            `;
        } else if (msg.messageType === 'redpacket') {
            return `
                ${timestamp}
                <div class="message-item redpacket ${msg.type}">
                    ${msg.type === 'other' ? '<div class="avatar"></div>' : ''}
                    <div class="message-bubble">
                        🧧 ${msg.text}
                    </div>
                    ${msg.type === 'user' ? '<div class="avatar"></div>' : ''}
                </div>
            `;
        } else {
            return `
                ${timestamp}
                <div class="message-item ${msg.type}">
                    ${msg.type === 'other' ? '<div class="avatar"></div>' : ''}
                    <div class="message-bubble">${msg.text}</div>
                    ${msg.type === 'user' ? '<div class="avatar"></div>' : ''}
                </div>
            `;
        }
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    const chat = data.wechatChats[data.currentChat];
    const timestamp = Date.now();
    
    chat.messages.push({
        type: 'user',
        text: text,
        messageType: 'text',
        timestamp: timestamp
    });
    
    input.value = '';
    saveData();
    renderMessages();
    
    // 调用AI API
    callChatAPI(text, chat);
}

// 调用聊天API
async function callChatAPI(userMessage, chat) {
    if (!data.settings.apiUrl || !data.settings.apiKey) {
        // 如果没有配置API，使用模拟回复
        setTimeout(() => {
            chat.messages.push({
                type: 'other',
                text: '请先在设置中配置API，以启用AI功能。',
                messageType: 'text',
                timestamp: Date.now()
            });
            saveData();
            renderMessages();
            updateChatStats();
        }, 500);
        return;
    }
    
    try {
        // 构建消息历史
        const messages = [];
        
        // 添加系统角色提示
        const rolePrompt = chat.role && aiRoles[chat.role] 
            ? aiRoles[chat.role].prompt 
            : chat.customPrompt || aiRoles[''].prompt;
        
        messages.push({
            role: 'system',
            content: rolePrompt
        });
        
        // 添加历史消息（最近10条）
        const recentMessages = chat.messages.slice(-10);
        recentMessages.forEach(msg => {
            if (msg.messageType === 'text') {
                messages.push({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            }
        });
        
        const response = await fetch(data.settings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.settings.apiKey}`
            },
            body: JSON.stringify({
                model: data.settings.apiModel,
                messages: messages,
                temperature: parseFloat(data.settings.apiTemperature),
                max_tokens: parseInt(data.settings.apiMaxTokens)
            })
        });
        
        const result = await response.json();
        
        if (result.choices && result.choices[0]) {
            const aiResponse = result.choices[0].message.content;
            
            chat.messages.push({
                type: 'other',
                text: aiResponse,
                messageType: 'text',
                timestamp: Date.now()
            });
            
            // 更新token统计
            if (result.usage) {
                chat.tokenCount = (chat.tokenCount || 0) + result.usage.total_tokens;
            }
            
            saveData();
            renderMessages();
            updateChatStats();
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('API调用失败:', error);
        chat.messages.push({
            type: 'other',
            text: '抱歉，API调用失败: ' + error.message,
            messageType: 'text',
            timestamp: Date.now()
        });
        saveData();
        renderMessages();
    }
}

// 表情功能
function toggleEmojis() {
    const panel = document.getElementById('emoji-panel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function insertEmoji(emoji) {
    const input = document.getElementById('message-input');
    input.value += emoji;
    input.focus();
}

// 发送图片
function sendImage() {
    const imageUrl = prompt('请输入图片URL:');
    if (imageUrl && imageUrl.trim()) {
        const chat = data.wechatChats[data.currentChat];
        chat.messages.push({
            type: 'user',
            text: '图片',
            messageType: 'image',
            imageUrl: imageUrl.trim(),
            timestamp: Date.now()
        });
        saveData();
        renderMessages();
    }
}

// 发送位置
function sendLocation() {
    const location = prompt('请输入位置信息:');
    if (location && location.trim()) {
        const chat = data.wechatChats[data.currentChat];
        chat.messages.push({
            type: 'user',
            text: location.trim(),
            messageType: 'location',
            timestamp: Date.now()
        });
        saveData();
        renderMessages();
    }
}

// 对话菜单
function showConversationMenu() {
    const chat = data.wechatChats[data.currentChat];
    showScreen('conversation-menu-screen');
    
    // 加载角色设置
    document.getElementById('ai-role').value = chat.role || '';
    if (chat.role === 'custom') {
        document.getElementById('custom-role-group').style.display = 'block';
        document.getElementById('custom-role-prompt').value = chat.customPrompt || '';
    } else {
        document.getElementById('custom-role-group').style.display = 'none';
    }
    
    updateChatStats();
}

function changeRole() {
    const chat = data.wechatChats[data.currentChat];
    const role = document.getElementById('ai-role').value;
    chat.role = role;
    
    if (role === 'custom') {
        document.getElementById('custom-role-group').style.display = 'block';
    } else {
        document.getElementById('custom-role-group').style.display = 'none';
        chat.customPrompt = '';
    }
    
    saveData();
}

function updateChatStats() {
    const chat = data.wechatChats[data.currentChat];
    document.getElementById('message-count').textContent = chat.messages.length;
    document.getElementById('token-count').textContent = chat.tokenCount || 0;
}

// 生成对话总结
async function generateSummary() {
    const chat = data.wechatChats[data.currentChat];
    
    if (chat.messages.length === 0) {
        alert('当前对话为空，无法生成总结');
        return;
    }
    
    if (!data.settings.summaryApiUrl || !data.settings.apiKey) {
        alert('请先在设置中配置总结API');
        return;
    }
    
    try {
        // 构建对话内容
        const conversation = chat.messages
            .filter(msg => msg.messageType === 'text')
            .map(msg => `${msg.type === 'user' ? '用户' : 'AI'}: ${msg.text}`)
            .join('\\n');
        
        const response = await fetch(data.settings.summaryApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.settings.apiKey}`
            },
            body: JSON.stringify({
                model: data.settings.summaryModel,
                messages: [
                    {
                        role: 'system',
                        content: '请用简洁的语言总结以下对话的主要内容：'
                    },
                    {
                        role: 'user',
                        content: conversation
                    }
                ],
                temperature: 0.5,
                max_tokens: 500
            })
        });
        
        const result = await response.json();
        
        if (result.choices && result.choices[0]) {
            const summary = result.choices[0].message.content;
            alert('对话总结:\\n\\n' + summary);
        } else {
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('总结生成失败:', error);
        alert('总结生成失败: ' + error.message);
    }
}

// 导出对话
function exportConversation() {
    const chat = data.wechatChats[data.currentChat];
    const exportData = {
        name: chat.name,
        messages: chat.messages,
        role: chat.role,
        customPrompt: chat.customPrompt,
        tokenCount: chat.tokenCount,
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chat.name}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 清空对话
function clearConversation() {
    if (confirm('确定要清空当前对话吗？此操作不可恢复。')) {
        const chat = data.wechatChats[data.currentChat];
        chat.messages = [];
        chat.tokenCount = 0;
        saveData();
        renderMessages();
        updateChatStats();
    }
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
            message = '狼人杀游戏开发中...\\n敬请期待!';
            break;
        case 'turtle-soup':
            message = '海龟汤游戏开发中...\\n敬请期待!';
            break;
        case 'guess':
            message = '你说我猜游戏开发中...\\n敬请期待!';
            break;
    }
    alert(message);
}

// 设置功能
function loadSettings() {
    document.getElementById('api-url').value = data.settings.apiUrl || '';
    document.getElementById('api-key').value = data.settings.apiKey || '';
    document.getElementById('api-model').value = data.settings.apiModel || 'gpt-4';
    document.getElementById('api-temperature').value = data.settings.apiTemperature || 0.7;
    document.getElementById('api-max-tokens').value = data.settings.apiMaxTokens || 2000;
    
    document.getElementById('summary-api-url').value = data.settings.summaryApiUrl || '';
    document.getElementById('summary-model').value = data.settings.summaryModel || 'gpt-4';
    
    document.getElementById('image-api-url').value = data.settings.imageApiUrl || '';
    document.getElementById('image-model').value = data.settings.imageModel || 'dall-e-3';
    
    document.getElementById('tts-api-url').value = data.settings.ttsApiUrl || '';
    document.getElementById('tts-voice').value = data.settings.ttsVoice || 'alloy';
}

function saveSettings() {
    data.settings.apiUrl = document.getElementById('api-url').value;
    data.settings.apiKey = document.getElementById('api-key').value;
    data.settings.apiModel = document.getElementById('api-model').value;
    data.settings.apiTemperature = parseFloat(document.getElementById('api-temperature').value);
    data.settings.apiMaxTokens = parseInt(document.getElementById('api-max-tokens').value);
    
    data.settings.summaryApiUrl = document.getElementById('summary-api-url').value;
    data.settings.summaryModel = document.getElementById('summary-model').value;
    
    data.settings.imageApiUrl = document.getElementById('image-api-url').value;
    data.settings.imageModel = document.getElementById('image-model').value;
    
    data.settings.ttsApiUrl = document.getElementById('tts-api-url').value;
    data.settings.ttsVoice = document.getElementById('tts-voice').value;
    
    // 保存自定义角色提示词
    if (data.currentChat !== null) {
        const chat = data.wechatChats[data.currentChat];
        if (chat.role === 'custom') {
            chat.customPrompt = document.getElementById('custom-role-prompt').value;
        }
    }
    
    saveData();
    alert('设置已保存!');
}

// 数据导入导出
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cphone_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('确定要导入数据吗？这将覆盖当前所有数据。')) {
                    data = importedData;
                    saveData();
                    alert('数据导入成功!');
                    location.reload();
                }
            } catch (error) {
                alert('数据导入失败: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
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
            const loadedData = JSON.parse(saved);
            // 合并数据，保留新版本的默认值
            data = {
                ...data,
                ...loadedData,
                settings: {
                    ...data.settings,
                    ...loadedData.settings
                },
                theme: {
                    ...data.theme,
                    ...loadedData.theme
                }
            };
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
                    { 
                        type: 'other', 
                        text: '你好!我是AI助手,有什么可以帮你的吗?',
                        messageType: 'text',
                        timestamp: Date.now()
                    }
                ],
                role: '',
                customPrompt: '',
                tokenCount: 0
            }
        ];
    }
    
    if (data.tweets.length === 0) {
        data.tweets = [
            {
                username: 'CPhone官方',
                content: '欢迎使用CPhone v2.0! 全新的AI增强功能，支持多种API配置、角色扮演、对话管理等。',
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
            const emojiPanel = document.getElementById('emoji-panel');
            if (emojiPanel.style.display === 'none' || !emojiPanel.style.display) {
                sendMessage();
            }
        }
    }
});
