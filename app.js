import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZkCXioFje39FqmUFkM2GqEAcPvVo7csg",
  authDomain: "ritiro-olio.firebaseapp.com",
  projectId: "ritiro-olio",
  storageBucket: "ritiro-olio.firebasestorage.app",
  messagingSenderId: "1088319614799",
  appId: "1:1088319614799:web:e89cfc9c6a548b318c9f3a",
  measurementId: "G-Q0WCW8T0B1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// Funzione per convertire username in email interna
function usernameToEmail(username) {
  return `${username}@ritiriolio.com`;
}

// LOGIN
document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const email = usernameToEmail(username);

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Errore login: " + error.message);
  }
});

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
});

// CREAZIONE CLIENTE DA ADMIN
document.getElementById("create-client-btn").addEventListener("click", async () => {
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();
  const newEmail = usernameToEmail(newUsername);

  try {
    const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), { username: newUsername, role: "cliente" });
    alert(`Cliente ${newUsername} creato!`);
  } catch (err) {
    alert("Errore creazione cliente: " + err.message);
  }
});

// PRENOTAZIONE RITIRO
document.getElementById("prenota-btn").addEventListener("click", async () => {
  const data = document.getElementById("prenota-data").value;
  if (!data) {
    alert("Seleziona una data!");
    return;
  }
  await addDoc(collection(db, "prenotazioni"), {
    user: auth.currentUser.email,
    data: data
  });
  alert("Prenotazione effettuata!");
});
