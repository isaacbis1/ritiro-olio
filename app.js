// Importa le funzioni necessarie da Firebase (versione modular) via CDN
// (Assicurati che le versioni corrispondano a quelle disponibili)
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

/* -------------------------------------------------------------
   1. CONFIGURAZIONE FIREBASE
   (Inserisci i tuoi valori di configurazione)
------------------------------------------------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configurazione Firebase (verifica che i dati siano corretti!)
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
const db = getFirestore(app);

// TEST: Aggiungere un documento nella raccolta "test"
async function testFirestore() {
  try {
    await addDoc(collection(db, "test"), { name: "Prova", createdAt: new Date() });
    console.log("✅ Documento creato con successo!");
  } catch (error) {
    console.error("❌ Errore Firestore:", error);
  }
}

testFirestore();


/* -------------------------------------------------------------
   2. Riferimenti a elementi del DOM
------------------------------------------------------------- */
const loginBtn        = document.getElementById('login-btn');
const createUserBtn   = document.getElementById('create-user-btn');
const logoutBtn       = document.getElementById('logout-btn');
const outputEl        = document.getElementById('output');

/* -------------------------------------------------------------
   3. FUNZIONE DI AIUTO PER MOSTRARE MESSAGGI
------------------------------------------------------------- */
function showOutput(message) {
  if (outputEl) {
    const now = new Date().toLocaleTimeString();
    outputEl.innerHTML += `[${now}] ${message}<br/>`;
    outputEl.scrollTop = outputEl.scrollHeight; // Scrolla in fondo
  } else {
    alert(message);
  }
}

/* -------------------------------------------------------------
   4. LOGIN
   Admin "di prova": admin@olio.com / admin123
------------------------------------------------------------- */
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (email === "admin@olio.com") {
        showOutput("Benvenuto Admin! (UID: " + user.uid + ")");
      } else {
        showOutput("Login effettuato con successo! UID: " + user.uid);
      }
    } catch (error) {
      console.error(error);
      showOutput("Errore di login. " + error.message);
    }
  });
}

/* -------------------------------------------------------------
   5. CREAZIONE NUOVO UTENTE
------------------------------------------------------------- */
if (createUserBtn) {
  createUserBtn.addEventListener('click', async () => {
    const newEmail = document.getElementById('new-email').value;
    const newPassword = document.getElementById('new-password').value;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const createdUser = userCredential.user;

      // (Opzionale) Salvo i dati utente in Firestore
      await addDoc(collection(db, "users"), {
        uid: createdUser.uid,
        email: createdUser.email,
        createdAt: serverTimestamp()
      });

      showOutput("Utente creato con successo! UID: " + createdUser.uid);
    } catch (error) {
      console.error(error);
      showOutput("Errore nella creazione dell'utente. " + error.message);
    }
  });
}

/* -------------------------------------------------------------
   6. LOGOUT
------------------------------------------------------------- */
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      showOutput("Logout effettuato con successo!");
    } catch (error) {
      console.error(error);
      showOutput("Errore durante il logout. " + error.message);
    }
  });
}
