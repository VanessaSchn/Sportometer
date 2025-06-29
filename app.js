import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDCRCgLmu0otr0e9IRpEzWw9VKxMdW8hgY",
    authDomain: "kilometerzaehler-21137.firebaseapp.com",
    projectId: "kilometerzaehler-21137",
    storageBucket: "kilometerzaehler-21137.appspot.com",
    messagingSenderId: "1038240895552",
    appId: "1:1038240895552:web:fa3c50ff3fcef471bf45a5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let kmChart;

const addEntry = async (group, points, imageFile, name) => {
    const imageUrl = await uploadImage(group, imageFile);
    const docRef = doc(db, "kilometer", group);
    await updateDoc(docRef, {
        entries: arrayUnion({ points, imageUrl, name })
    });
    updateTable(group);
};

const uploadImage = async (group, file) => {
    const storageRef = ref(storage, `${group}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

document.getElementById("group1-form").onsubmit = async (e) => {
    e.preventDefault();
    const points = parseInt(document.getElementById("group1-activity").value);
    const imageFile = document.getElementById("group1-image").files[0];
    const name = document.getElementById("group1-name").value;
    await addEntry("group1", points, imageFile, name);
    e.target.reset();
    updateChart();
};

document.getElementById("group2-form").onsubmit = async (e) => {
    e.preventDefault();
    const points = parseInt(document.getElementById("group2-activity").value);
    const imageFile = document.getElementById("group2-image").files[0];
    const name = document.getElementById("group2-name").value;
    await addEntry("group2", points, imageFile, name);
    e.target.reset();
    updateChart();
};

const getGroupData = async (group) => {
    const docRef = doc(db, "kilometer", group);
    const docSnap = await getDoc(docRef);
    let totalPoints = 0;
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.entries)) {
            totalPoints = data.entries.reduce((sum, entry) => sum + entry.points, 0);
        }
    }
    return { totalPoints };
};

const updateChart = async () => {
    const group1 = await getGroupData("group1");
    const group2 = await getGroupData("group2");

    if (kmChart) kmChart.destroy();

    const ctx = document.getElementById("kmChart").getContext("2d");
    kmChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Gruppe 1", "Gruppe 2"],
            datasets: [{
                label: "Punkte",
                data: [group1.totalPoints, group2.totalPoints],
                backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 159, 64, 0.2)"],
                borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 159, 64, 1)"],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
};

const updateTable = async (group) => {
    const docRef = doc(db, "kilometer", group);
    const docSnap = await getDoc(docRef);
    const tableBody = document.querySelector(`#${group}-table tbody`);
    tableBody.innerHTML = '';

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.entries)) {
            data.entries.forEach(entry => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${entry.name}</td>
                    <td>${entry.points}</td>
                    <td><img src="${entry.imageUrl}" class="thumbnail" style="width:50px; cursor:pointer;"></td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
};

window.onload = () => {
    updateChart();
    updateTable("group1");
    updateTable("group2");
};

const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const closeModal = document.querySelector(".close");

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("thumbnail")) {
        modal.style.display = "block";
        modalImage.src = e.target.src;
    }
});

closeModal.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
};
