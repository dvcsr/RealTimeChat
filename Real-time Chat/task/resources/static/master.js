///global var
const chatContainter = document.getElementById("messages");
const messageForm = document.querySelector('#chatForm');
const messageInput = document.querySelector('#input-msg');
const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usersList = document.querySelector('#users');
const usernameForm = document.querySelector('#usernameForm');
const publicChatBtnContainer = document.querySelector('#chat-window');
const chatBtn = publicChatBtnContainer.querySelector('#public-chat-btn');
const chatInfo = document.querySelector('#chat-with');
const usernameFormTitle = document.querySelector('.username-form-title');
let stompClient = null;
let sessionUsername = null;
const unreadMessageState = new Map();


//x setting up functional UI LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    //1
    usernameForm.addEventListener('submit', addUsername);
    //2
    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (chatInfo.textContent === 'Public chat'){
            sendMessage();
        }
        else sendPrivateMessage(chatInfo.textContent);
    });
    //3
    document.querySelector('#users').addEventListener('click', (event) => {
        const userContainer = event.target.closest('.user-container');
        if (!userContainer) return;
        const userTarget = userContainer.querySelector('.user');
        if (userTarget.textContent !== chatInfo.textContent) {
            chatInfo.textContent = userTarget.textContent;
            setActiveUserUI(userContainer);
            clearChatUI();
            openPrivateChat(event);
        }
    })
    //4
    document.querySelector('#chat-window').addEventListener('click', (event) => {
        event.preventDefault();
        let button = event.target.closest('#public-chat-btn');
        if (button) {
            openPublicChat();
        }
    })
})

//x initialization
function addUsername(event) {
    event.preventDefault();
    sessionUsername = document.querySelector('#input-username').value.trim();
    if (sessionUsername) {
        connectWebSocket();
    }
}

function connectWebSocket() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    const websocket = new SockJS("/chat-task");
    stompClient = Stomp.over(websocket);
    console.log("websocket and stomp client instantiation invoked")
    stompClient.connect({}, initialize, (error) => console.log('error!', error));
}

function initialize() {
    initializeSubscription();
    sendInitialMessages();
}

//x     SUBSCRIPTION
function initializeSubscription() {
    stompClient.subscribe(`/user/${sessionUsername}/topic/history`, renderChatHistoryUI); //get HISTORY PUBLIC chat
    stompClient.subscribe(`/user/${sessionUsername}/private/history`, renderChatHistoryUI); //get HISTORY PRIVATE chat
    stompClient.subscribe('/topic/usernames', updateOnlineUserListUI); //get current online users
    stompClient.subscribe('/topic/public', handlingPublicMessage); //get REALTIME PUBLIC chat, system notification
    stompClient.subscribe(`/user/${sessionUsername}/private/message`, handlingPrivateMessage); //get REALTIME PRIVATE CHAT
    console.log("stomp client connected and subscribed initialized!");
}

function sendInitialMessages() {
    stompClient.send("/app/register", {}, sessionUsername); //register username
    stompClient.send("/app/fetchHistory", {}, JSON.stringify({})); //fetching chat history
    stompClient.send("/app/onlineUsers", {}, JSON.stringify({})); //fetching online users
    console.log("stomp client connected and init message request sent!");
}

//x INFRASTRUCTURE
function openPublicChat(){
    if (chatInfo.textContent === 'Public chat') return;
    activateChatButtonUI();
    chatInfo.textContent = 'Public chat';
    stompClient.send("/app/fetchHistory", {}, JSON.stringify({}));
}

function openPrivateChat(event) {
    event.preventDefault();
    let receiverUsername = event.target.textContent;
    chatInfo.textContent = receiverUsername;
    console.log('sender is' + sessionUsername);
    console.log('receiver is' + receiverUsername);
    let data = {
        sender : sessionUsername,
        receiver : receiverUsername
    }
    stompClient.send("/app/fetchPrivate", {}, JSON.stringify(data)); //only when clicked, not necessary for initialization.
}

function sendMessage() {
    let messageContent = messageInput.value.trim();

    if (messageContent === "") return;
    if (!stompClient) return;

    let chatMessage = {
        content: messageContent,
        sender: sessionUsername
    }

    stompClient.send("/app/sendChat", {}, JSON.stringify(chatMessage));
    messageInput.value = '';
    console.log("chat sent to stomp server");
}

function sendPrivateMessage(userTarget) {
    let messageContent = messageInput.value.trim();
    if (messageContent === "") return;
    if (!stompClient) return;

    let privateChat = {
        sender: sessionUsername,
        content: messageContent,
        receiver: userTarget
    }
    messageInput.value = '';
    stompClient.send("/app/private-message", {}, JSON.stringify(privateChat));
    console.log("chat sent to stomp server");
}

function handlingPublicMessage(response) {
    const message = JSON.parse(response.body);
    switch (message.type) {
        case 'ERROR':
            showUsernameWarningUI();
            console.log("case error invoked");
            break;
        case 'JOIN':
            usernamePage.classList.add('hidden');
            chatPage.classList.remove('hidden');
            console.log("HIDDEN OPERATION INVOKED");
            if (message.content.includes(sessionUsername)) break;
            stompClient.send("/app/onlineUsers", {}, JSON.stringify({}));
            displaySystemMessageToPublicUI(message);
            break;
        case 'CHAT':
            if (chatInfo.textContent === 'Public chat') displayChatBubbleUI(message);
            break;
        case 'LEAVE':
            stompClient.send("/app/onlineUsers", {}, JSON.stringify({}));
            displaySystemMessageToPublicUI(message);
    }
}

function handlingPrivateMessage(response) {
    const message = JSON.parse(response.body);
    let senderUsername = message.sender;
    let initialCount = unreadMessageState.get(senderUsername);
    unreadMessageState.set(senderUsername, initialCount + 1);
    let currentCount = unreadMessageState.get(senderUsername);

    if (chatInfo.textContent === senderUsername || chatInfo.textContent === message.receiver) {
        displayChatBubbleUI(message);
        unreadMessageState.set(senderUsername, 0);
    } else {
        let liElements = document.querySelectorAll('#users li');
        let userContainerLi = Array.from(liElements).find(el => el.querySelector('.user').textContent === senderUsername);
        let userContainer = userContainerLi.querySelector('.user-container');
        if (!userContainer) return;

        let counter = userContainer.querySelector('.new-message-counter');
        if (counter) {
            counter.textContent = currentCount;
            updateUsertoTop(userContainer);
        } else {
            let counterTag = document.createElement("p");
            counterTag.classList.add('new-message-counter');
            counterTag.textContent = currentCount;
            userContainer.appendChild(counterTag);
            updateUsertoTop(userContainer);

        }
    }
}

//x UI RENDERING
function renderChatHistoryUI(response) {
    clearChatUI();
    const messages = JSON.parse(response.body);

    messages.forEach(item => {
        if (item.sender !== null) {
            displayChatBubbleUI(item);
        }
        else displaySystemMessageToPublicUI(item);
    })
}

function displayChatBubbleUI(message) {
    let messageElement = document.createElement('li');
    messageElement.classList.add('message-container');
    chatContainter.appendChild(messageElement);
    let headerElement = document.createElement('div');
    headerElement.classList.add('sender-header');
    headerElement.innerHTML = `<span class="sender">${message.sender}</span>
<span class="date">${message.timestamp}</span>`;

    let textElement = document.createElement('p');
    const messageText = document.createTextNode(message.content);
    textElement.classList.add('message');
    textElement.appendChild(messageText); //p text node

    messageElement.appendChild(headerElement);
    messageElement.appendChild(textElement); //li,p, text node

    chatContainter.lastElementChild.scrollIntoView({behavior: "smooth"});
}

function clearChatUI() {
    chatContainter.innerHTML = '';
}

function updateOnlineUserListUIv2(response) {
    const userListData = JSON.parse(response.body);
    clearActiveUsersUI();
    userListData.forEach(user => {
        if (user !== sessionUsername) {
            let userContainer = createUserContainer(user);

            let onlineTag = document.querySelector('#users');
            onlineTag.appendChild(userContainer);

            if (!unreadMessageState.has(user)) {
                unreadMessageState.set(user, 0);
                console.log('state initialized')
            }
        }
    })
}

function updateOnlineUserListUI(response) {
    const currentUsers = document.querySelector('#users');
    const usersListItem = currentUsers.querySelectorAll('li');
    if (!usersListItem) {
        updateOnlineUserListUIv2(response);
    } else {
        const userListBE = JSON.parse(response.body);
        const onlineTag = document.querySelector('#users');
        const containers = onlineTag.querySelectorAll('.user-container');
        let dcUser = {};

        const userListFE = Array.from(containers)
            .map(container => container.querySelector('.user').textContent); //array of username string

        userListFE.forEach(user => {
            if (!userListBE.includes(user)) {
                dcUser[user] = user;
            }
        })

        containers.forEach((container) => {
            if (container.querySelector('.user').textContent in dcUser) {
                let targetLi = container.parentElement;
                targetLi.remove();
                if (chatInfo.textContent === container.querySelector('.user').textContent) {
                    document.querySelectorAll('.user-container')[0].click();
                }
            }
        })



    userListBE.forEach(username => {
        if (!userListFE.includes(username) && username !== sessionUsername) {
            let userContainer = createUserContainer(username);

            const onlineTag = document.querySelector('#users');
            onlineTag.appendChild(userContainer);

            if (!unreadMessageState.has(username)) {
                unreadMessageState.set(username, 0);
                console.log('state initialized')
            }
        }
    })
    }
}

function clearActiveUsersUI() {
    const usersListItem = usersList.querySelectorAll('li');
    usersListItem.forEach((item) => item.remove());
}

function showUsernameWarningUI() {
    usernameFormTitle.innerHTML = "username taken! Think of other username:";
}

function displaySystemMessageToPublicUI(message) {
    if (chatInfo.textContent === 'Public chat'){
        const messageElement = document.createElement('li');
        messageElement.classList.add('system-message');
        messageElement.innerHTML = `
        <div class="message-content-system">
            ${message.content}
        </div>
    `;
        chatContainter.appendChild(messageElement);
        messageElement.scrollIntoView({behavior: "smooth"});
        console.log("join message displayed");
    }
}

function setActiveUserUI(clickedContainer) {
    chatBtn.classList.remove('active');
    const containers = document.querySelectorAll('.user-container');
    containers.forEach(container => {
        container.classList.remove('active');
    });
    clickedContainer.classList.add('active');
    const counterTag = clickedContainer.querySelector('.new-message-counter');
    if (counterTag){
        clickedContainer.querySelector('.new-message-counter').remove();
        unreadMessageState.set(clickedContainer.querySelector('.user').textContent, 0)
    }
}

function activateChatButtonUI(){
    chatBtn.classList.add('active');
    const containers = document.querySelectorAll('.user-container');
    containers.forEach(container => {
        container.classList.remove('active');
    });
}

//x reusable helper functions for common operations

function updateUsertoTop(container) {
    let copyContainer = container.cloneNode(true);
    container.parentElement.remove();
    let newLi = document.createElement("li");
    newLi.appendChild(copyContainer);
    const onlineTag = document.querySelector('#users');
    onlineTag.prepend(newLi);

}

function createUserContainer(username){
    //create li element
    let userLi = document.createElement('li');

    //create user container li
    let userContainer = document.createElement('div');
    userContainer.classList.add('user-container');
    userContainer.setAttribute('data-username', username); // for easy removal later

    //create user div
    let userItem = document.createElement('div');
    userItem.classList.add('user');
    userItem.textContent = username;

    //append
    userContainer.appendChild(userItem);
    userLi.appendChild(userContainer);

    return userLi;
}