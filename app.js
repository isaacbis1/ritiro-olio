/* app.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
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
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Inserisci i TUOI valori (Project ID, ecc.)
const firebaseConfig = {
  apiKey: "AIzaSyBZkCXioFje39FqmUFkM2GqEAcPvVo7csg",
  authDomain: "ritiro-olio.firebaseapp.com",
  projectId: "ritiro-olio",
  storageBucket: "ritiro-olio.firebasestorage.app",
  messagingSenderId: "1088319614799",
  appId: "1:1088319614799:web:e89cfc9c6a548b318c9f3a",
  measurementId: "G-Q0WCW8T0B1"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Riferimenti a elementi del DOM
const loginSection    = document.getElementById("login-section");
const adminSection    = document.getElementById("admin-section");
const clienteSection  = document.getElementById("cliente-section");
const logoutSection   = document.getElementById("logout-section");

const loginBtn        = document.getElementById("login-btn");
const logoutBtn       = document.getElementById("logout-btn");

// Admin
const fatturaEmailInput   = document.getElementById("fattura-email");
const fatturaDataInput    = document.getElementById("fattura-data");
const fatturaImportoInput = document.getElementById("fattura-importo");
const fatturaFileInput    = document.getElementById("fattura-file");
const aggiungiFatturaBtn  = document.getElementById("aggiungi-fattura");
const listaFatture        = document.getElementById("lista-fatture");

// Cliente
const listaFattureCliente = document.getElementById("lista-fatture-cliente");

let currentUser = null;
let currentUserRole = null;

/* Al cambiare dello stato di autenticazione, controlliamo se c'è user loggato */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Carica il documento utente per vedere se è admin o cliente
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      currentUser = user;
      currentUserRole = docSnap.data().role;
      console.log("Ruolo utente:", currentUserRole);

      // Mostra/occulta sezioni
      loginSection.classList.add("d-none");
      logoutSection.classList.remove("d-none");

      if (currentUserRole === "admin") {
        adminSection.classList.remove("d-none");
        clienteSection.classList.add("d-none");
        loadFatture(); // Carichiamo fatture in admin
      } else {
        adminSection.classList.add("d-none");
        clienteSection.classList.remove("d-none");
        loadFattureCliente(); // Carica fatture per questo user
      }

    } else {
      // Se non troviamo un doc in "users", potremmo crearne uno con default role = "cliente"
      await setDoc(docRef, {
        email: user.email,
        role: "cliente"
      });
      currentUserRole = "cliente";
      alert("Non risultavi in 'users'. Ora sei impostato come 'cliente'. Ricarica la pagina.");
    }

  } else {
    // Nessun utente loggato
    console.log("Nessun utente loggato.");
    currentUser = null;
    currentUserRole = null;

    loginSection.classList.remove("d-none");
    adminSection.classList.add("d-none");
    clienteSection.classList.add("d-none");
    logoutSection.classList.add("d-none");
  }
});

/* LOGIN */
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login riuscito!");
  } catch (error) {
    alert("Errore login: " + error.message);
  }
});

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

/* ADMIN: Aggiungi Fattura (Base64) */
aggiungiFatturaBtn.addEventListener("click", async () => {
  if (currentUserRole !== "admin") {
    alert("Non sei admin!");
    return;
  }

  const clienteEmail = fatturaEmailInput.value.trim();
  const data = fatturaDataInput.value;
  const importo = fatturaImportoInput.value.trim();
  const file = fatturaFileInput.files[0];

  if (!clienteEmail || !data || !importo || !file) {
    alert("Compila tutti i campi (e seleziona un file).");
    return;
  }

  // Converti il file in Base64
  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64File = e.target.result;

    // Salviamo la fattura su Firestore
    try {
      await addDoc(collection(db, "fatture"), {
        clienteEmail: clienteEmail,
        data: data,
        importo: importo,
        fileBase64: base64File,
        createdAt: new Date()
      });
      alert("Fattura aggiunta!");
      // Svuota form
      fatturaEmailInput.value = "";
      fatturaDataInput.value = "";
      fatturaImportoInput.value = "";
      fatturaFileInput.value = "";
      loadFatture();
    } catch (error) {
      console.error("Errore addDoc fatture:", error);
      alert("Errore nel salvataggio della fattura.");
    }
  };
  reader.readAsDataURL(file);
});

/* Carica TUTTE le fatture per Admin */
async function loadFatture() {
  listaFatture.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const fattureRef = collection(db, "fatture");
    const q = query(fattureRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listaFatture.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata.</li>";
      return;
    }

    listaFatture.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const fat = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${fat.clienteEmail}</strong><br/>
          Data: ${fat.data} - Importo: €${fat.importo}
        </div>
      `;
      // Bottone "Vedi"
      const btnVedi = document.createElement("button");
      btnVedi.textContent = "Vedi";
      btnVedi.className = "btn btn-sm btn-outline-secondary";
      btnVedi.addEventListener("click", () => viewFatturaBase64(fat.fileBase64));
      li.appendChild(btnVedi);

      listaFatture.appendChild(li);
    });
  } catch (error) {
    console.error("Errore loadFatture:", error);
    listaFatture.innerHTML = "<li class='list-group-item'>Errore caricamento fatture.</li>";
  }
}

/* Carica Fatture SOLO del Cliente loggato */
async function loadFattureCliente() {
  listaFattureCliente.innerHTML = "<li class='list-group-item'>Caricamento...</li>";
  try {
    const fattureRef = collection(db, "fatture");
    // Filtriamo in base al campo 'clienteEmail'
    const q = query(fattureRef, where("clienteEmail", "==", currentUser.email), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listaFattureCliente.innerHTML = "<li class='list-group-item'>Nessuna fattura trovata per il tuo account.</li>";
      return;
    }

    listaFattureCliente.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const fat = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          Data: ${fat.data} - Importo: €${fat.importo}
        </div>
      `;
      // Bottone "Vedi"
      const btnVedi = document.createElement("button");
      btnVedi.textContent = "Vedi";
      btnVedi.className = "btn btn-sm btn-outline-secondary";
      btnVedi.addEventListener("click", () => viewFatturaBase64(fat.fileBase64));
      li.appendChild(btnVedi);

      listaFattureCliente.appendChild(li);
    });
  } catch (error) {
    console.error("Errore loadFattureCliente:", error);
    listaFattureCliente.innerHTML = "<li class='list-group-item'>Errore caricamento fatture cliente.</li>";
  }
}

/* Funzione per aprire una nuova finestra/tab con l'immagine in base64 */
function viewFatturaBase64(base64Data) {
  const newWin = window.open();
  newWin.document.write(`<img src="${base64Data}" style="max-width:100%">`);
}
