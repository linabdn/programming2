//required for front end communication between client and server

const socket = io();

const inboxPeople = document.querySelector(".inbox__people");


let userName = "";
let id;
const newUserConnected = function (data) {
    

    //give the user a random unique id
    id = Math.floor(Math.random() * 1000000);
    userName = 'user-' +id;
    //console.log(typeof(userName));   
    

    //emit an event with the user id
    socket.emit("new user", userName);
    //call
    addToUsersBox(userName);
};

const addToUsersBox = function (userName) {
    //This if statement checks whether an element of the user-userlist
    //exists and then inverts the result of the expression in the condition
    //to true, while also casting from an object to boolean
    if (!!document.querySelector(`.${userName}-userlist`)) {
        return;
    
    }
    
    //setup the divs for displaying the connected users
    //id is set to a string including the username
    const userBox = `
    <div class="chat_id ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
    //set the inboxPeople div with the value of userbox
    inboxPeople.innerHTML += userBox;
};

//call 
newUserConnected();

//when a new user event is detected
socket.on("new user", function (data) {
  data.map(function (user) {
          return addToUsersBox(user);
      });
});

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

// Similarly for disconnections:
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
  messageBox.scrollTop = messageBox.scrollHeight; //autoscroll when overflow in message history
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

  //is the message sent or received
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

  clearTimeout(typingTimer); 
  socket.emit("stop typing", userName);

  inputField.value = "";
});

socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
  messageBox.scrollTop = messageBox.scrollHeight; //autoscroll when overflow in message history
});

// 1. Création de l'indicateur de typing (sécurité améliorée)
const typingIndicator = document.createElement("div");
typingIndicator.className = "typing-indicator";
typingIndicator.innerHTML = '<span id="typing-text"></span>';

// Insertion au bon endroit (avant le formulaire dans .content)
const contentDiv = document.querySelector(".content");
contentDiv.insertBefore(typingIndicator, contentDiv.querySelector(".message_form"));

// 2. Détection du typing avec timeout
let typingTimer;
inputField.addEventListener("input", () => {
  // Annule le précédent timeout
  clearTimeout(typingTimer);
  
  // Émet l'événement "typing"
  socket.emit("typing", userName);
  
  // Après 2 secondes sans activité, émet "stop typing"
  typingTimer = setTimeout(() => {
    socket.emit("stop typing", userName);
  }, 2000);
});

// 3. Affichage des indicateurs des autres utilisateurs
socket.on("typing", (username) => {
  if (username !== userName) {
    typingIndicator.querySelector("span").textContent = `${username} is typing...`;
    typingIndicator.style.display = "block";
  }
});

socket.on("stop typing", () => {
  typingIndicator.style.display = "none";
});

