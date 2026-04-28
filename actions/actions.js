import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZLCs0_s0Tky6NXFxTGsBbQk3L8ce9zYk",
  authDomain: "slpm-1ca9b.firebaseapp.com",
  projectId: "slpm-1ca9b",
  storageBucket: "slpm-1ca9b.firebasestorage.app",
  messagingSenderId: "928771242176",
  appId: "1:928771242176:web:a4a1dbbe6d8549cb915525"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CODE_ADMIN = "SLPM-1936";

function estAdmin() {
    return sessionStorage.getItem('admin') === 'oui';
}

function mettreAJourUI() {
    const formAdmin = document.getElementById('formAdmin');
    const btnAdmin = document.getElementById('btnAdmin');
    if (estAdmin()) {
        formAdmin.style.display = 'block';
        btnAdmin.textContent = '🔓 Admin connecté';
        btnAdmin.style.backgroundColor = '#2a7a2a';
    } else {
        formAdmin.style.display = 'none';
        btnAdmin.textContent = '🔒 Admin';
        btnAdmin.style.backgroundColor = '';
    }
    chargerActions();
}

document.getElementById('btnAdmin').addEventListener('click', function () {
    if (estAdmin()) {
        sessionStorage.removeItem('admin');
        mettreAJourUI();
        return;
    }
    const code = prompt('Entrez le code administrateur :');
    if (code === CODE_ADMIN) {
        sessionStorage.setItem('admin', 'oui');
        mettreAJourUI();
    } else if (code !== null) {
        alert('Code incorrect.');
    }
});

// Aperçu image
document.getElementById('imageAction').addEventListener('change', function () {
    const fichier = this.files[0];
    const apercu = document.getElementById('apercuAction');
    const erreurImage = document.getElementById('erreurImageAction');

    if (!fichier) { apercu.style.display = 'none'; return; }

    if (fichier.size > 1 * 1024 * 1024) {
        erreurImage.style.display = 'block';
        apercu.style.display = 'none';
        this.value = '';
        return;
    }

    erreurImage.style.display = 'none';
    const lecteur = new FileReader();
    lecteur.onload = function (e) {
        apercu.src = e.target.result;
        apercu.style.display = 'block';
    };
    lecteur.readAsDataURL(fichier);
});

async function chargerActions() {
    const conteneur = document.getElementById('listeActions');
    conteneur.innerHTML = '<p><em>Chargement...</em></p>';

    const q = query(collection(db, 'actions'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    conteneur.innerHTML = '';

    if (snapshot.empty) {
        conteneur.innerHTML = '<p><em>Aucune action enregistrée pour le moment.</em></p>';
        return;
    }

    snapshot.forEach(function (docSnap) {
        const action = docSnap.data();
        const div = document.createElement('div');
        div.className = 'article';

        const imageHTML = action.image
            ? `<img src="${action.image}" alt="Image de l'action" style="max-width:100%; max-height:300px; border-radius:8px; margin-top:10px; display:block;">`
            : '';

        const deleteHTML = estAdmin()
            ? `<a class="delete" data-id="${docSnap.id}" style="cursor:pointer;">✕ Supprimer</a>`
            : '';

        div.innerHTML = `
            <h3>${action.titre}</h3>
            <small>${action.date}</small>
            <p>${action.description}</p>
            ${imageHTML}
            ${deleteHTML}
        `;

        if (estAdmin()) {
            div.querySelector('.delete').addEventListener('click', function () {
                supprimerAction(this.dataset.id);
            });
        }

        conteneur.appendChild(div);
    });
}

async function ajouterAction() {
    const titre = document.getElementById('titreAction').value.trim();
    const date = document.getElementById('dateAction').value.trim();
    const description = document.getElementById('descAction').value.trim();
    const erreur = document.getElementById('erreurAction');
    const erreurImage = document.getElementById('erreurImageAction');
    const fichierImage = document.getElementById('imageAction').files[0];

    if (!titre || !date || !description) { erreur.style.display = 'block'; return; }
    erreur.style.display = 'none';

    if (fichierImage) {
        if (fichierImage.size > 1 * 1024 * 1024) { erreurImage.style.display = 'block'; return; }
        const lecteur = new FileReader();
        lecteur.onload = async function (e) { await sauvegarderAction(titre, date, description, e.target.result); };
        lecteur.readAsDataURL(fichierImage);
    } else {
        await sauvegarderAction(titre, date, description, null);
    }
}

async function sauvegarderAction(titre, date, description, imageBase64) {
    try {
        await addDoc(collection(db, 'actions'), {
            titre, date, description, image: imageBase64, timestamp: Date.now()
        });
    } catch (e) {
        alert("Erreur lors de la sauvegarde : " + e.message);
        return;
    }

    document.getElementById('titreAction').value = '';
    document.getElementById('dateAction').value = '';
    document.getElementById('descAction').value = '';
    document.getElementById('imageAction').value = '';
    document.getElementById('apercuAction').style.display = 'none';
    chargerActions();
}

async function supprimerAction(id) {
    if (!confirm('Supprimer cette action ?')) return;
    await deleteDoc(doc(db, 'actions', id));
    chargerActions();
}

document.getElementById('btnAjouterAction').addEventListener('click', ajouterAction);
mettreAJourUI();