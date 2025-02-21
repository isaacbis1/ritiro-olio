import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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
const db = getFirestore(app);

let currentUser = null;

// LOGIN
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    document.getElementById("login-section").classList.add("d-none");
    document.getElementById("logout-section").classList.remove("d-none");

    if (email === "admin@olio.com") {
      document.getElementById("admin-section").classList.remove("d-none");
      loadFatture();
    } else {
      document.getElementById("cliente-section").classList.remove("d-none");
      loadFattureCliente(email);
    }
  } catch (error) {
    alert("Errore: " + error.message);
  }
});

// LOGOUT
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  location.reload();
});

// ADMIN: Aggiungi Fattura
document.getElementById("aggiungi-fattura").addEventListener("click", async () => {
  const email = document.getElementById("fattura-email").value;
  const data = document.getElementById("fattura-data").value;
  const importo = document.getElementById("fattura-importo").value;
  const fileInput = document.getElementById("fattura-file").files[0];

  if (!email || !data || !importo || !fileInput) {
    alert("Compila tutti i campi e carica un file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const base64File = event.target.result;

    await addDoc(collection(db, "fatture"), {
      cliente: email,
      data: data,
      importo: importo,
      fileBase64: base64File
    });

    alert("Fattura aggiunta!");
    loadFatture();
  };
  reader.readAsDataURL(fileInput);
});

// CARICA LE FATTURE (ADMIN)
async function loadFatture() {
  const querySnapshot = await getDocs(collection(db, "fatture"));
  const listaFatture = document.getElementById("lista-fatture");
  listaFatture.innerHTML = "";
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerHTML = `Cliente: ${data.cliente} - Data: ${data.data} - Importo: €${data.importo} <button class="btn btn-sm btn-secondary ms-2" onclick="viewFattura('${data.fileBase64}')">Vedi</button>`;
    listaFatture.appendChild(li);
  });
}

// CARICA LE FATTURE PER IL CLIENTE
async function loadFattureCliente(email) {
  const querySnapshot = await getDocs(collection(db, "fatture"));
  const listaFattureCliente = document.getElementById("lista-fatture-cliente");
  listaFattureCliente.innerHTML = "";
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.cliente === email) {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `Data: ${data.data} - Importo: €${data.importo} <button class="btn btn-sm btn-secondary ms-2" onclick="viewFattura('${data.fileBase64}')">Vedi</button>`;
      listaFattureCliente.appendChild(li);
    }
  });
}

// VISUALIZZA FATTURA
window.viewFattura = (base64) => {
  const newTab = window.open();
  newTab.document.write(`<img src="${base64}" style="width:100%">`);
};
