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

// Configurazione Firebase
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

// Riferimenti DOM
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const clienteSection = document.getElementById("cliente-section");
const logoutSection = document.getElementById("logout-section");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const createClientBtn = document.getElementById("create-client-btn");

// LOGIN con username (convertito in email)
loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const email = `${username}@ritiriolio.com`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Errore login: " + error.message);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// CREAZIONE CLIENTE DA ADMIN
createClientBtn.addEventListener("click", async () => {
  const newUsername = document.getElementById("new-username").value.trim();
  const newPassword = document.getElementById("new-password").value.trim();
  const newEmail = `${newUsername}@ritiriolio.com`;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
    const uid = userCred.user.uid;
    await setDoc(doc(db, "users", uid), { username: newUsername, role: "cliente" });
    alert(`Cliente ${newUsername} creato!`);
  } catch (err) {
    alert("Errore creazione cliente: " + err.message);
  }
});

// Controlla autenticazione
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      loginSection.classList.add("d-none");
      logoutSection.classList.remove("d-none");

      if (role === "admin") {
        adminSection.classList.remove("d-none");
        clienteSection.classList.add("d-none");
      } else {
        adminSection.classList.add("d-none");
        clienteSection.classList.remove("d-none");
      }
    } else {
      await setDoc(doc(db, "users", user.uid), { username: user.email.split("@")[0], role: "cliente" });
    }
  } else {
    loginSection.classList.remove("d-none");
    adminSection.classList.add("d-none");
    clienteSection.classList.add("d-none");
    logoutSection.classList.add("d-none");
  }
});
