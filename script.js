// 应用状态管理
const appState = {
    currentChat: null,
    chats: [],
    settings: {
        chatApi: {
            url: '',
            key: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7
        },
        summaryApi: {
            url: '',
            key: ''
        },
        imageApi: {
            url: '',
            key: ''
        },
        ttsApi: {
            url: '',
            key: ''
        },
        theme: 'default',
        wallpaper: null,
        globalFont: 'system',
        chatFontSize: 14
    },
    currentCharacter: null,
    currentUser: {
        nickname: '用户',
        realname: '',
        setting: '',
        avatar: null
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    updateTime();
    setInterval(updateTime, 1000);
    initEventListeners();
    loadChats();
});

// 更新时间
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = now.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    
    document.getElementById('statusTime').textContent = timeString;
    document.getElementById('mainTime').textContent = timeString;
    document.getElementById('mainDate').textContent = dateString;
}

// 初始化事件监听器
function initEventListeners() {
    // 应用图标点击
    document.querySelectorAll('.app-icon[data-app]').forEach(icon => {
        icon.addEventListener('click', function() {
            const appName = this.dataset.app;
            if (appName === 'wechat') {
                openWechat();
            }
        });
    });
    
    // 温度滑块
    const tempSlider = document.getElementById('temperature');
    const tempValue = document.getElementById('tempValue');
    if (tempSlider) {
        tempSlider.addEventListener('input', function() {
            tempValue.textContent = this.value;
            appState.settings.chatApi.temperature = parseFloat(this.value);
            saveSettings();
        });
    }
    
    // 字体大小滑块
    const fontSlider = document.getElementById('chatFontSize');
    const fontValue = document.getElementById('fontSizeValue');
    if (fontSlider) {
        fontSlider.addEventListener('input', function() {
            fontValue.textContent = this.value + 'px';
            setChatFontSize(this.value);
        });
    }
    
    // 消息输入框自动调整高度
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        
        // 回车发送消息
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // 文件输入处理
    document.getElementById('charAvatar')?.addEventListener('change', function(e) {
        handleAvatarUpload(e, 'charAvatarPreview');
    });
    
    document.getElementById('userAvatar')?.addEventListener('change', function(e) {
        handleAvatarUpload(e, 'userAvatarPreview');
    });
}

// 打开微信应用
function openWechat() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('wechatApp').classList.remove('hidden');
}

// 返回主页
function backToHome() {
    document.getElementById('wechatApp').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
}

// 显示添加聊天
function showAddChat() {
    appState.currentCharacter = null;
    document.getElementById('characterModal').classList.remove('hidden');
    // 清空表单
    document.getElementById('charNickname').value = '';
    document.getElementById('charRealname').value = '';
    document.getElementById('charSetting').value = '';
    document.getElementById('charAvatarPreview').innerHTML = '';
    document.getElementById('userNickname').value = appState.currentUser.nickname || '';
    document.getElementById('userRealname').value = appState.currentUser.realname || '';
    document.getElementById('userSetting').value = appState.currentUser.setting || '';
}

// 关闭角色设置弹窗
function closeCharacterModal() {
    document.getElementById('characterModal').classList.add('hidden');
}

// 保存角色
function saveCharacter() {
    const character = {
        id: appState.currentCharacter?.id || Date.now(),
        nickname: document.getElementById('charNickname').value,
        realname: document.getElementById('charRealname').value,
        setting: document.getElementById('charSetting').value,
        avatar: document.getElementById('charAvatarPreview').innerHTML,
        messages: appState.currentCharacter?.messages || [],
        archived: appState.currentCharacter?.archived || []
    };
    
    // 更新用户信息
    appState.currentUser = {
        nickname: document.getElementById('userNickname').value,
        realname: document.getElementById('userRealname').value,
        setting: document.getElementById('userSetting').value,
        avatar: document.getElementById('userAvatarPreview').innerHTML
    };
    
    // 保存或更新聊天
    const existingIndex = appState.chats.findIndex(c => c.id === character.id);
    if (existingIndex > -1) {
        appState.chats[existingIndex] = character;
    } else {
        appState.chats.push(character);
    }
    
    saveChats();
    loadChats();
    closeCharacterModal();
}

// 加载聊天列表
function loadChats() {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';
    
    appState.chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.onclick = () => openChat(chat.id);
        
        const lastMessage = chat.messages[chat.messages.length - 1];
        const lastMessageText = lastMessage ? lastMessage.content : '暂无消息';
        const lastMessageTime = lastMessage ? formatTime(lastMessage.timestamp) : '';
        
        chatItem.innerHTML = `
            <div class="chat-avatar">
                ${chat.avatar || chat.nickname.charAt(0)}
            </div>
            <div class="chat-details">
                <h4>${chat.nickname}</h4>
                <p>${lastMessageText}</p>
            </div>
            <span class="chat-time">${lastMessageTime}</span>
        `;
        
        chatList.appendChild(chatItem);
    });
}

// 打开聊天
function openChat(chatId) {
    const chat = appState.chats.find(c => c.id === chatId);
    if (!chat) return;
    
    appState.currentChat = chat;
    document.getElementById('chatName').textContent = chat.nickname;
    document.getElementById('chatList').parentElement.classList.add('hidden');
    document.getElementById('chatScreen').classList.remove('hidden');
    
    loadMessages();
}

// 返回聊天列表
function backToChatList() {
    document.getElementById('chatScreen').classList.add('hidden');
    document.getElementById('chatList').parentElement.classList.remove('hidden');
    appState.currentChat = null;
}

// 加载消息
function loadMessages() {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    if (!appState.currentChat) return;
    
    appState.currentChat.messages.forEach((msg, index) => {
        // 检查是否需要显示时间分割线
        if (msg.timeDivider) {
            const divider = document.createElement('div');
            divider.className = 'time-divider';
            divider.textContent = msg.timeDivider;
            container.appendChild(divider);
        }
        
        const messageEl = createMessageElement(msg);
        container.appendChild(messageEl);
    });
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 创建消息元素
function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.sender === 'user' ? 'sent' : 'received'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    if (msg.sender === 'user') {
        avatarDiv.innerHTML = appState.currentUser.avatar || appState.currentUser.nickname.charAt(0);
    } else {
        avatarDiv.innerHTML = appState.currentChat.avatar || appState.currentChat.nickname.charAt(0);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 处理不同类型的消息
    if (msg.type === 'text') {
        // 处理多条消息（用换行分隔）
        const messages = msg.content.split('\n');
        messages.forEach((text, i) => {
            if (text.trim()) {
                if (i > 0) {
                    const newMsg = messageDiv.cloneNode(true);
                    newMsg.querySelector('.message-content').innerHTML = `
                        <div class="message-bubble">${escapeHtml(text)}</div>
                    `;
                    messageDiv.parentNode?.insertBefore(newMsg, messageDiv.nextSibling);
                } else {
                    contentDiv.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
                }
            }
        });
    } else if (msg.type === 'image') {
        contentDiv.innerHTML = `
            <div class="message-image">
                <img src="${msg.content}" alt="图片">
                ${msg.description ? `<p>${escapeHtml(msg.description)}</p>` : ''}
            </div>
        `;
    } else if (msg.type === 'voice') {
        contentDiv.innerHTML = `
            <div class="message-voice">
                🎤 ${msg.duration || '语音消息'}
            </div>
        `;
    } else if (msg.type === 'redpacket') {
        contentDiv.innerHTML = `
            <div class="message-redpacket ${msg.opened ? 'opened' : ''}" onclick="openRedPacket(${msg.id})">
                <div>🧧</div>
                <div>${msg.amount ? `￥${msg.amount}` : '红包'}</div>
                <div>${msg.opened ? '已领取' : '点击领取'}</div>
            </div>
        `;
    } else if (msg.type === 'location') {
        contentDiv.innerHTML = `
            <div class="message-location">
                📍 ${escapeHtml(msg.content)}
            </div>
        `;
    }
    
    // 添加时间戳
    if (msg.timestamp) {
        const timeSpan = document.createElement('div');
        timeSpan.className = 'message-time';
        timeSpan.textContent = formatTime(msg.timestamp);
        contentDiv.appendChild(timeSpan);
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

// 发送消息
function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content || !appState.currentChat) return;
    
    const message = {
        id: Date.now(),
        sender: 'user',
        type: 'text',
        content: content,
        timestamp: new Date().toISOString()
    };
    
    appState.currentChat.messages.push(message);
    saveChats();
    loadMessages();
    
    input.value = '';
    input.style.height = 'auto';
}

// 发送给AI
async function sendWithAI() {
    if (!appState.currentChat) return;
    
    // 检查API设置
    if (!appState.settings.chatApi.url || !appState.settings.chatApi.key) {
        alert('请先配置聊天API');
        showSettings();
        return;
    }
    
    // 构建prompt
    const systemPrompt = buildSystemPrompt();
    const messages = buildChatHistory();
    
    try {
        // 显示加载状态
        const loadingMsg = {
            id: Date.now(),
            sender: 'ai',
            type: 'text',
            content: '正在思考...',
            timestamp: new Date().toISOString()
        };
        appState.currentChat.messages.push(loadingMsg);
        loadMessages();
        
        // 调用API
        const response = await callChatAPI(systemPrompt, messages);
        
        // 删除加载消息
        const loadingIndex = appState.currentChat.messages.findIndex(m => m.id === loadingMsg.id);
        if (loadingIndex > -1) {
            appState.currentChat.messages.splice(loadingIndex, 1);
        }
        
        // 添加AI回复
        const aiMessage = {
            id: Date.now(),
            sender: 'ai',
            type: 'text',
            content: response,
            timestamp: new Date().toISOString()
        };
        appState.currentChat.messages.push(aiMessage);
        saveChats();
        loadMessages();
        
    } catch (error) {
        console.error('AI回复失败:', error);
        alert('AI回复失败，请检查API设置');
    }
}

// 构建系统提示词
function buildSystemPrompt() {
    const character = appState.currentChat;
    const user = appState.currentUser;
    
    let prompt = `请AI扮演{{char}}，完全基于设定中的性格、知识和经历进行思考和回应，杜绝OOC（脱离角色）。
模拟真实的手机聊天软件对话（如微信、QQ），可以一次发送多条消息（多条消息使用"回车"隔开），模拟思考或连续发言的过程。
可以使用口语、缩略语、网络用语、表情包等。回复自然随意，可以有错别字或语病，就像真人聊天一样。
你需要记住对话的上下文，保持话题的连贯性，并基于{{char}}与{{user}}之间的关系做出符合角色的反应。

角色设定：
{{char}}名称：${character.nickname}
{{char}}真名：${character.realname}
{{char}}设定：${character.setting}

用户设定：
{{user}}名称：${user.nickname}
{{user}}真名：${user.realname}
{{user}}设定：${user.setting || '普通用户'}`;
    
    // 添加归档的事件
    if (character.archived && character.archived.length > 0) {
        prompt += '\n\n历史重要事件：\n';
        character.archived.forEach(event => {
            prompt += `- ${event}\n`;
        });
    }
    
    return prompt;
}

// 构建聊天历史
function buildChatHistory() {
    if (!appState.currentChat) return [];
    
    // 获取最近的消息（限制数量以控制token）
    const recentMessages = appState.currentChat.messages.slice(-20);
    
    return recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));
}

// 调用聊天API
async function callChatAPI(systemPrompt, messages) {
    const apiUrl = appState.settings.chatApi.url;
    const apiKey = appState.settings.chatApi.key;
    const model = appState.settings.chatApi.model;
    const temperature = appState.settings.chatApi.temperature;
    
    const requestBody = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        temperature: temperature,
        max_tokens: 1000
    };
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 开始新话题
function startNewTopic() {
    if (!appState.currentChat) return;
    
    // 添加时间分割线
    const lastMessage = appState.currentChat.messages[appState.currentChat.messages.length - 1];
    if (lastMessage) {
        lastMessage.timeDivider = getRandomTimeDivider();
    }
    
    // 调用AI时添加新话题提示
    const input = document.getElementById('messageInput');
    input.value = '';
    input.placeholder = '开始新话题...';
    
    // 设置标记，下次发送给AI时添加新话题提示
    appState.currentChat.newTopic = true;
    saveChats();
}

// 获取随机时间分割线文本
function getRandomTimeDivider() {
    const dividers = ['2分钟前', '5分钟前', '半小时前', '1小时前', '3小时前', '昨天', '前天'];
    return dividers[Math.floor(Math.random() * dividers.length)];
}

// 显示特殊输入
function showSpecialInput(type) {
    const input = document.getElementById('messageInput');
    
    switch(type) {
        case 'voice':
            const duration = prompt('语音时长（秒）：', '3');
            if (duration) {
                const message = {
                    id: Date.now(),
                    sender: 'user',
                    type: 'voice',
                    duration: duration + '秒',
                    timestamp: new Date().toISOString()
                };
                appState.currentChat.messages.push(message);
                saveChats();
                loadMessages();
            }
            break;
            
        case 'image':
            const description = prompt('图片描述：', '');
            if (description) {
                const message = {
                    id: Date.now(),
                    sender: 'user',
                    type: 'image',
                    content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mHPC90ZXh0Pjwvc3ZnPg==',
                    description: description,
                    timestamp: new Date().toISOString()
                };
                appState.currentChat.messages.push(message);
                saveChats();
                loadMessages();
            }
            break;
            
        case 'redpacket':
            const amount = prompt('红包金额：', '6.66');
            if (amount) {
                const message = {
                    id: Date.now(),
                    sender: 'user',
                    type: 'redpacket',
                    amount: amount,
                    opened: false,
                    timestamp: new Date().toISOString()
                };
                appState.currentChat.messages.push(message);
                saveChats();
                loadMessages();
            }
            break;
            
        case 'location':
            const location = prompt('位置信息：', '北京市朝阳区');
            if (location) {
                const message = {
                    id: Date.now(),
                    sender: 'user',
                    type: 'location',
                    content: location,
                    timestamp: new Date().toISOString()
                };
                appState.currentChat.messages.push(message);
                saveChats();
                loadMessages();
            }
            break;
    }
}

// 打开红包
function openRedPacket(msgId) {
    if (!appState.currentChat) return;
    
    const message = appState.currentChat.messages.find(m => m.id === msgId);
    if (message && !message.opened) {
        message.opened = true;
        saveChats();
        loadMessages();
    }
}

// 显示聊天设置
function showChatSettings() {
    if (!appState.currentChat) return;
    
    // 计算token数量（估算）
    const tokenCount = estimateTokens();
    document.getElementById('tokenCount').textContent = tokenCount;
    
    document.getElementById('chatSettingsModal').classList.remove('hidden');
}

// 关闭聊天设置
function closeChatSettings() {
    document.getElementById('chatSettingsModal').classList.add('hidden');
}

// 估算token数量
function estimateTokens() {
    if (!appState.currentChat) return 0;
    
    let totalChars = 0;
    
    // 系统提示词
    totalChars += buildSystemPrompt().length;
    
    // 聊天历史
    appState.currentChat.messages.forEach(msg => {
        totalChars += msg.content.length;
    });
    
    // 粗略估算：平均每4个字符约等于1个token（中文约2个字符1个token）
    return Math.round(totalChars / 2);
}

// 事件归档
async function archiveEvents() {
    if (!appState.currentChat) return;
    
    if (!appState.settings.summaryApi.url || !appState.settings.summaryApi.key) {
        alert('请先配置总结API');
        showSettings();
        return;
    }
    
    try {
        const summary = await callSummaryAPI();
        
        if (!appState.currentChat.archived) {
            appState.currentChat.archived = [];
        }
        appState.currentChat.archived.push(summary);
        
        // 清空当前消息，只保留归档
        appState.currentChat.messages = [];
        
        saveChats();
        loadMessages();
        alert('事件归档成功');
        
    } catch (error) {
        console.error('事件归档失败:', error);
        alert('事件归档失败，请检查API设置');
    }
}

// 调用总结API
async function callSummaryAPI() {
    const messages = appState.currentChat.messages.map(m => 
        `${m.sender === 'user' ? appState.currentUser.nickname : appState.currentChat.nickname}: ${m.content}`
    ).join('\n');
    
    const prompt = `请根据以下聊天记录，简要总结本次聊天的主要内容，并记录对角色影响重大的一两句台词：\n\n${messages}`;
    
    const response = await fetch(appState.settings.summaryApi.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${appState.settings.summaryApi.key}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: '你是一个聊天记录总结助手' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 200
        })
    });
    
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 清空聊天记录
function clearChatHistory() {
    if (!appState.currentChat) return;
    
    if (confirm('确定要清空聊天记录吗？')) {
        appState.currentChat.messages = [];
        saveChats();
        loadMessages();
    }
}

// 设置聊天背景
function setChatBackground(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('messagesContainer').style.backgroundImage = `url(${e.target.result})`;
            if (appState.currentChat) {
                appState.currentChat.background = e.target.result;
                saveChats();
            }
        };
        reader.readAsDataURL(file);
    }
}

// 导出聊天
function exportChat() {
    if (!appState.currentChat) return;
    
    const data = JSON.stringify(appState.currentChat, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${appState.currentChat.nickname}_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 导入聊天数据
function importChatData(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const chat = JSON.parse(e.target.result);
                chat.id = Date.now(); // 新ID避免冲突
                appState.chats.push(chat);
                saveChats();
                loadChats();
                alert('聊天导入成功');
            } catch (error) {
                alert('导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    }
}

// 显示设置
function showSettings() {
    document.getElementById('settingsScreen').classList.remove('hidden');
    
    // 加载当前设置
    document.getElementById('chatApiUrl').value = appState.settings.chatApi.url || '';
    document.getElementById('chatApiKey').value = appState.settings.chatApi.key || '';
    document.getElementById('chatModel').value = appState.settings.chatApi.model || 'gpt-3.5-turbo';
    document.getElementById('temperature').value = appState.settings.chatApi.temperature || 0.7;
    document.getElementById('tempValue').textContent = appState.settings.chatApi.temperature || 0.7;
    
    document.getElementById('summaryApiUrl').value = appState.settings.summaryApi.url || '';
    document.getElementById('summaryApiKey').value = appState.settings.summaryApi.key || '';
}

// 关闭设置
function closeSettings() {
    // 保存设置
    appState.settings.chatApi.url = document.getElementById('chatApiUrl').value;
    appState.settings.chatApi.key = document.getElementById('chatApiKey').value;
    appState.settings.chatApi.model = document.getElementById('chatModel').value;
    appState.settings.chatApi.temperature = parseFloat(document.getElementById('temperature').value);
    
    appState.settings.summaryApi.url = document.getElementById('summaryApiUrl').value;
    appState.settings.summaryApi.key = document.getElementById('summaryApiKey').value;
    
    saveSettings();
    document.getElementById('settingsScreen').classList.add('hidden');
}

// 显示主题设置
function showTheme() {
    document.getElementById('themeScreen').classList.remove('hidden');
}

// 关闭主题设置
function closeTheme() {
    document.getElementById('themeScreen').classList.add('hidden');
}

// 应用主题
function applyTheme(theme) {
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
    appState.settings.theme = theme;
    saveSettings();
    
    // 更新颜色
    if (theme === 'dark') {
        document.documentElement.style.setProperty('--primary-color', '#4a5568');
        document.documentElement.style.setProperty('--secondary-color', '#2d3748');
    } else if (theme === 'ocean') {
        document.documentElement.style.setProperty('--primary-color', '#2193b0');
        document.documentElement.style.setProperty('--secondary-color', '#6dd5ed');
    } else if (theme === 'forest') {
        document.documentElement.style.setProperty('--primary-color', '#11998e');
        document.documentElement.style.setProperty('--secondary-color', '#38ef7d');
    } else {
        document.documentElement.style.setProperty('--primary-color', '#667eea');
        document.documentElement.style.setProperty('--secondary-color', '#764ba2');
    }
}

// 设置壁纸
function setWallpaper(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.querySelector('.screen').style.backgroundImage = `url(${e.target.result})`;
            appState.settings.wallpaper = e.target.result;
            saveSettings();
        };
        reader.readAsDataURL(file);
    }
}

// 重置壁纸
function resetWallpaper() {
    document.querySelector('.screen').style.backgroundImage = '';
    appState.settings.wallpaper = null;
    saveSettings();
}

// 设置全局字体
function setGlobalFont(font) {
    document.body.style.fontFamily = font === 'system' 
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
        : font;
    appState.settings.globalFont = font;
    saveSettings();
}

// 设置聊天字体大小
function setChatFontSize(size) {
    document.documentElement.style.setProperty('--chat-font-size', size + 'px');
    appState.settings.chatFontSize = size;
    saveSettings();
}

// 导出设置
function exportSettings() {
    const data = JSON.stringify(appState.settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `uphone_settings_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 导入设置
function importSettings(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const settings = JSON.parse(e.target.result);
                appState.settings = { ...appState.settings, ...settings };
                saveSettings();
                alert('设置导入成功');
                location.reload();
            } catch (error) {
                alert('导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    }
}

// 清除所有数据
function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        localStorage.clear();
        location.reload();
    }
}

// 导入角色（支持JSON和PNG）
function importCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.type === 'application/json') {
        // 导入JSON
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const character = JSON.parse(e.target.result);
                document.getElementById('charNickname').value = character.nickname || '';
                document.getElementById('charRealname').value = character.realname || '';
                document.getElementById('charSetting').value = character.setting || '';
                if (character.avatar) {
                    document.getElementById('charAvatarPreview').innerHTML = `<img src="${character.avatar}" alt="头像">`;
                }
            } catch (error) {
                alert('导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    } else if (file.type === 'image/png') {
        // 从PNG元数据导入（需要额外的库支持，这里简化处理）
        alert('PNG导入功能开发中');
    }
}

// 处理头像上传
function handleAvatarUpload(event, previewId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).innerHTML = `<img src="${e.target.result}" alt="头像">`;
        };
        reader.readAsDataURL(file);
    }
}

// 保存设置到localStorage
function saveSettings() {
    localStorage.setItem('uphone_settings', JSON.stringify(appState.settings));
}

// 加载设置
function loadSettings() {
    const saved = localStorage.getItem('uphone_settings');
    if (saved) {
        appState.settings = JSON.parse(saved);
        
        // 应用主题
        if (appState.settings.theme) {
            applyTheme(appState.settings.theme);
        }
        
        // 应用壁纸
        if (appState.settings.wallpaper) {
            document.querySelector('.screen').style.backgroundImage = `url(${appState.settings.wallpaper})`;
        }
        
        // 应用字体
        if (appState.settings.globalFont) {
            setGlobalFont(appState.settings.globalFont);
        }
        
        // 应用字体大小
        if (appState.settings.chatFontSize) {
            setChatFontSize(appState.settings.chatFontSize);
        }
    }
}

// 保存聊天到localStorage
function saveChats() {
    localStorage.setItem('uphone_chats', JSON.stringify(appState.chats));
}

// 加载聊天
function loadChats() {
    const saved = localStorage.getItem('uphone_chats');
    if (saved) {
        appState.chats = JSON.parse(saved);
    }
    
    // 更新聊天列表UI
    const chatList = document.getElementById('chatList');
    if (chatList) {
        chatList.innerHTML = '';
        appState.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.onclick = () => openChat(chat.id);
            
            const lastMessage = chat.messages && chat.messages[chat.messages.length - 1];
            const lastMessageText = lastMessage ? lastMessage.content.substring(0, 30) + '...' : '暂无消息';
            const lastMessageTime = lastMessage ? formatTime(lastMessage.timestamp) : '';
            
            chatItem.innerHTML = `
                <div class="chat-avatar">
                    ${chat.avatar || chat.nickname.charAt(0)}
                </div>
                <div class="chat-details">
                    <h4>${chat.nickname}</h4>
                    <p>${escapeHtml(lastMessageText)}</p>
                </div>
                <span class="chat-time">${lastMessageTime}</span>
            `;
            
            chatList.appendChild(chatItem);
        });
    }
}

// 格式化时间
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return '刚刚';
    } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// HTML转义
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}