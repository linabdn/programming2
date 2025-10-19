//most of the original code was kept intact. comments only where modifications were made or parts added

const socket = io();

const inboxPeople = document.querySelector(".inbox__people");


let userName = "";
let id;
const newUserConnected = function (data) {
    
    id = Math.floor(Math.random() * 1000000);
    userName = 'user-' +id; 
    
    socket.emit("new user", userName);
    addToUsersBox(userName);
};

const addToUsersBox = function (userName) {
    if (!!document.querySelector(`.${userName}-userlist`)) {
        return;
    
    }
    
    const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
    inboxPeople.innerHTML += userBox;
};

newUserConnected();

socket.on("new user", function (data) {
  data.map(function (user) {
          return addToUsersBox(user);
      });
});

//adding notification when a new user joins
socket.on("user joined", function(userName) {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const joinMessage = `
  <div class="incoming__message"> 
    <div class="received__message" style="background-color: #e98dbc;">
      <p>${userName} joined the chat</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  document.querySelector(".messages__history").innerHTML += joinMessage;
  messageBox.scrollTop = messageBox.scrollHeight; //autoscroll when overflow in message history
});

//similar code for when a user leaves chat 
socket.on("user disconnected", function(userName) {
  document.querySelector(`.${userName}-userlist`).remove();
  
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const leaveMessage = `
  <div class="incoming__message">
    <div class="received__message" style="background-color: #e98dbc;">
      <p>${userName} left the chat</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  document.querySelector(".messages__history").innerHTML += leaveMessage;
  messageBox.scrollTop = messageBox.scrollHeight;
});


const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
};

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }

  socket.emit("chat message", {
    message: inputField.value,
    nick: userName,
  });

  //timer for typing indicator stop and typing inducator stops when message is sent
  clearTimeout(typingTimer); 
  socket.emit("stop typing", userName);

  inputField.value = "";
});

socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
  messageBox.scrollTop = messageBox.scrollHeight; //autoscroll when overflow in message history
});

const typingIndicator = document.querySelector('.typing-indicator');
const typingText = document.getElementById('typing-users');

let typingTimer;
//detection of typing event
inputField.addEventListener("input", () => {
  //clear last timer
  clearTimeout(typingTimer);
  
  //emits typing event
  socket.emit("typing", userName);
  
  //stops timing after 2 seconds of no typing
  typingTimer = setTimeout(() => {
    socket.emit("stop typing", userName);
  }, 2000);
});

//showing notification in case of typing event
socket.on("typing", (username) => {
  if (username !== userName) {
    typingIndicator.querySelector("span").textContent = `${username} is typing...`;
    typingIndicator.style.display = "block";
  }
});

socket.on("stop typing", () => {
  typingIndicator.style.display = "none"; //hiding typing indicator when someone finished/stopped typing 
});

