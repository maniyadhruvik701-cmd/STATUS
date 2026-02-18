import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhmlBkoFnHYbuE9qdfcmS1Ui6vjc5jeAU",
    authDomain: "status-b71a8.firebaseapp.com",
    databaseURL: "https://status-b71a8-default-rtdb.firebaseio.com",
    projectId: "status-b71a8",
    storageBucket: "status-b71a8.firebasestorage.app",
    messagingSenderId: "604103941643",
    appId: "1:604103941643:web:f67debe724038d9183310e",
    measurementId: "G-PH17NDPVF1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Storage Management Keys
const SAVE_KEY_DATA = 'status_table_data';
const SAVE_KEY_PAGE = 'status_current_page';
const SAVE_KEY_CONFIG = 'status_dropdown_config';

// Pagination State
let currentPage = parseInt(localStorage.getItem(SAVE_KEY_PAGE)) || 1;
const rowsPerPage = 20;

// Config Dropdowns
const defaultConfig = {
    platforms: ['Indiamart', 'Google', 'Personal', 'Paid'],
    types: ['Reseller', 'Wholeseller', 'Online Brand'],
    statuses: ['Visit Done', 'Visit', 'Pending', 'Call Done']
};

let dropdownConfig = JSON.parse(localStorage.getItem(SAVE_KEY_CONFIG)) || defaultConfig;
let tableData = JSON.parse(localStorage.getItem(SAVE_KEY_DATA)) || [];

// Firebase Sync Functions
async function syncToFirebase() {
    if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        try {
            await set(ref(db, 'users/' + userId + '/data'), tableData);
            await set(ref(db, 'users/' + userId + '/config'), dropdownConfig);
        } catch (e) { console.error("Sync Error:", e); }
    }
}

function loadFromFirebase() {
    if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        onValue(ref(db, 'users/' + userId), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.data) {
                    tableData = data.data;
                    localStorage.setItem(SAVE_KEY_DATA, JSON.stringify(tableData));
                }
                if (data.config) {
                    dropdownConfig = data.config;
                    localStorage.setItem(SAVE_KEY_CONFIG, JSON.stringify(dropdownConfig));
                }
                renderTable();
            }
        });
    }
}

// Local Storage Wrappers
function saveConfig() {
    localStorage.setItem(SAVE_KEY_CONFIG, JSON.stringify(dropdownConfig));
    syncToFirebase();
}

function saveData() {
    localStorage.setItem(SAVE_KEY_DATA, JSON.stringify(tableData));
    syncToFirebase();
}

function savePage() {
    localStorage.setItem(SAVE_KEY_PAGE, currentPage.toString());
}

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const dataEntryView = document.getElementById('data-entry-view');
const reportsView = document.getElementById('reports-view');
const performanceView = document.getElementById('performance-view');
const pendingReportView = document.getElementById('pending-report-view');
const viewTitle = document.getElementById('view-title');
const viewSubtitle = document.getElementById('view-subtitle');

const signinForm = document.getElementById('signin-form');
const logoutBtn = document.getElementById('logout-btn');

const tableBody = document.getElementById('table-body');
const addRowBtn = document.getElementById('addRowBtn');
const paginationContainer = document.getElementById('pagination-controls');

const navDataEntry = document.getElementById('nav-data-entry');
const navReports = document.getElementById('nav-reports');
const navPerformance = document.getElementById('nav-performance');
const navPending = document.getElementById('nav-pending');

// To Do Report Elements
const reportStartDate = document.getElementById('report-start-date');
const generateReportBtn = document.getElementById('generate-report-btn');
const reportResults = document.getElementById('report-results');
const summaryTableBody = document.getElementById('summary-table-body');

// Performance Report Elements
const perfStartDate = document.getElementById('perf-start-date');
const perfEndDate = document.getElementById('perf-end-date');
const generatePerfBtn = document.getElementById('generate-perf-btn');
const perfResults = document.getElementById('perf-results');
const perfTableBody = document.getElementById('perf-table-body');

// Pending Report Elements
const pendingStartDate = document.getElementById('pending-start-date');
const pendingEndDate = document.getElementById('pending-end-date');
const generatePendingBtn = document.getElementById('generate-pending-btn');
const pendingResults = document.getElementById('pending-results');
const pendingTableBody = document.getElementById('pending-table-body');

// Modal Elements
const optionsModal = document.getElementById('options-modal');
const modalTitle = document.getElementById('modal-title');
const modalOptionsList = document.getElementById('modal-options-list');
const newOptionInput = document.getElementById('new-option-input');
const addOptionBtn = document.getElementById('add-option-btn');
const closeModalBtn = document.getElementById('close-modal');

let activeConfigKey = '';

// Auth Handlers
if (signinForm) {
    signinForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            alert("Login failed: " + err.message);
        }
    };
}

if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem(SAVE_KEY_PAGE);
        } catch (err) {
            console.error("Logout Error:", err);
        }
    };
}

// Navigation
function switchView(view) {
    if (!dataEntryView) return;
    [dataEntryView, reportsView, performanceView, pendingReportView].forEach(v => v.classList.add('hidden'));
    [navDataEntry, navReports, navPerformance, navPending].forEach(n => n?.classList.remove('active'));

    if (view === 'data-entry') {
        dataEntryView.classList.remove('hidden');
        navDataEntry?.classList.add('active');
        viewTitle.textContent = 'Data Entry';
        viewSubtitle.textContent = 'Manage and input your records';
        renderTable();
    } else if (view === 'reports') {
        reportsView.classList.remove('hidden');
        navReports?.classList.add('active');
        viewTitle.textContent = 'To Do List';
        viewSubtitle.textContent = 'Check your tasks by follow-up date';
    } else if (view === 'performance') {
        performanceView.classList.remove('hidden');
        navPerformance?.classList.add('active');
        viewTitle.textContent = 'Work Report';
        viewSubtitle.textContent = 'Summary of activities within a date range';
    } else if (view === 'pending') {
        pendingReportView.classList.remove('hidden');
        navPending?.classList.add('active');
        viewTitle.textContent = 'Pending Report';
        viewSubtitle.textContent = 'Summary of pending visits within a date range';
    }
}

if (navDataEntry) navDataEntry.onclick = () => switchView('data-entry');
if (navReports) navReports.onclick = () => switchView('reports');
if (navPerformance) navPerformance.onclick = () => switchView('performance');
if (navPending) navPending.onclick = () => switchView('pending');

// Modal logic
function openOptionsModal(configKey) {
    activeConfigKey = configKey;
    modalTitle.textContent = `Manage ${configKey.charAt(0).toUpperCase() + configKey.slice(1)}`;
    renderModalOptions();
    optionsModal.classList.remove('hidden');
}

function renderModalOptions() {
    modalOptionsList.innerHTML = '';
    const options = dropdownConfig[activeConfigKey];
    options.forEach((opt, index) => {
        const div = document.createElement('div');
        div.className = 'option-entry';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = opt;
        input.onchange = (e) => {
            dropdownConfig[activeConfigKey][index] = e.target.value;
            saveConfig();
            renderTable();
        };
        const actions = document.createElement('div');
        actions.className = 'option-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon btn-danger-icon';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.onclick = () => {
            dropdownConfig[activeConfigKey].splice(index, 1);
            saveConfig();
            renderModalOptions();
            renderTable();
        };
        actions.appendChild(deleteBtn);
        div.appendChild(input);
        div.appendChild(actions);
        modalOptionsList.appendChild(div);
    });
}

if (addOptionBtn) {
    addOptionBtn.onclick = () => {
        const newVal = newOptionInput.value.trim();
        if (newVal) {
            dropdownConfig[activeConfigKey].push(newVal);
            newOptionInput.value = '';
            saveConfig();
            renderModalOptions();
            renderTable();
        }
    };
}

if (closeModalBtn) closeModalBtn.onclick = () => optionsModal.classList.add('hidden');

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-config')) {
        openOptionsModal(e.target.dataset.config);
    }
});

// Table Rendering
function createRow(data, actualIndex) {
    const tr = document.createElement('tr');
    const fields = [
        { key: 'date', type: 'date' },
        { key: 'name', type: 'text' },
        { key: 'company', type: 'text' },
        { key: 'platform', type: 'select', configKey: 'platforms', label: 'Platform' },
        { key: 'type', type: 'select', configKey: 'types', label: 'Type' },
        { key: 'status', type: 'select', configKey: 'statuses', label: 'Status' },
        { key: 'orderDate', type: 'date' },
        { key: 'totalQty', type: 'number' },
        { key: 'followUp', type: 'date' },
        { key: 'comments', type: 'text' }
    ];
    fields.forEach(f => {
        const td = document.createElement('td');
        if (f.type === 'select') {
            const select = document.createElement('select');
            select.className = 'cell-input';

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = `-- Select ${f.label} --`;
            placeholder.selected = !data[f.key];
            select.appendChild(placeholder);

            dropdownConfig[f.configKey].forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                if (opt === data[f.key]) o.selected = true;
                select.appendChild(o);
            });
            select.onchange = (e) => { tableData[actualIndex][f.key] = e.target.value; saveData(); };
            td.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = f.type;
            input.className = 'cell-input';
            input.value = data[f.key] || '';
            input.onchange = (e) => { tableData[actualIndex][f.key] = e.target.value; saveData(); };
            td.appendChild(input);
        }
        tr.appendChild(td);
    });
    return tr;
}

function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const pageData = tableData.slice(startIndex, startIndex + rowsPerPage);
    pageData.forEach((row, index) => tableBody.appendChild(createRow(row, startIndex + index)));
    renderPagination();
}

function renderPagination() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; savePage(); renderTable(); };
        paginationContainer.appendChild(btn);
    }
}

if (addRowBtn) {
    addRowBtn.onclick = () => {
        for (let i = 0; i < 50; i++) {
            tableData.unshift({
                date: '', name: '', company: '', platform: '',
                type: '', status: '',
                orderDate: '', totalQty: '', followUp: '', comments: ''
            });
        }
        currentPage = 1; saveData(); savePage(); renderTable();
    };
}

const clearAllBtn = document.getElementById('clearAllBtn');
if (clearAllBtn) {
    clearAllBtn.onclick = () => {
        if (confirm('Are you sure you want to CLEAR ALL entries? This action cannot be undone.')) {
            tableData = [];
            currentPage = 1;
            saveData();
            savePage();
            renderTable();
        }
    };
}

const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.onclick = () => {
        if (tableData.length === 0) return alert('No data to export');
        const headers = ["Date", "Name", "Company", "Platform", "Type", "Status", "Order Date", "Total Qty", "Follow-up", "Comments"];
        const rows = tableData.map(r => [
            r.date, r.name, r.company, r.platform, r.type, r.status, r.orderDate, r.totalQty, r.followUp, r.comments
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `status_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

// Report Logics
if (generateReportBtn) {
    generateReportBtn.onclick = () => {
        const d = reportStartDate.value;
        if (!d) return alert('Select a Date');
        const filtered = tableData.filter(r => r.followUp === d);
        reportResults.classList.remove('hidden');
        summaryTableBody.innerHTML = '';
        dropdownConfig.statuses.forEach(s => {
            const count = filtered.filter(r => r.status === s).length;
            if (count > 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="font-weight:600;">${s}</td><td style="text-align:center; color:var(--success); font-weight:800;">${count} To Do</td>`;
                summaryTableBody.appendChild(tr);
            }
        });
    };
}

if (generatePerfBtn) {
    generatePerfBtn.onclick = () => {
        const start = perfStartDate.value;
        const end = perfEndDate.value;
        if (!start || !end) return alert('Select Range');
        const filtered = tableData.filter(r => r.date >= start && r.date <= end);
        perfResults.classList.remove('hidden');
        perfTableBody.innerHTML = '';
        dropdownConfig.statuses.forEach(s => {
            const count = filtered.filter(r => r.status === s).length;
            if (count > 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="font-weight:600;">${s}</td><td style="text-align:center; color:var(--secondary); font-weight:800;">${count}</td>`;
                perfTableBody.appendChild(tr);
            }
        });
    };
}

if (generatePendingBtn) {
    generatePendingBtn.onclick = () => {
        const start = pendingStartDate.value;
        const end = pendingEndDate.value;
        if (!start || !end) return alert('Select Range');
        const filtered = tableData.filter(r => (r.date >= start && r.date <= end) && r.status === 'Pending');
        pendingResults.classList.remove('hidden');
        pendingTableBody.innerHTML = '';
        const count = filtered.length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;">Pending</td>
            <td style="text-align:center; color:var(--warning); font-weight:800; font-size: 1.2rem;">${count}</td>
        `;
        pendingTableBody.appendChild(tr);
    };
}

// Global Auth Observer (Moved to end to ensure all elements are ready)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in UID:", user.uid);
        if (authSection) authSection.classList.add('hidden');
        if (dashboardSection) dashboardSection.classList.remove('hidden');
        loadFromFirebase();
        switchView('data-entry');
    } else {
        if (authSection) authSection.classList.remove('hidden');
        if (dashboardSection) dashboardSection.classList.add('hidden');
    }
});

console.log('Firebase Dashboard Initialized');
