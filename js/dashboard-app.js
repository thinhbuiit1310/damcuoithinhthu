import { db, auth } from './firebase-config.js';
import {
    collection, getDocs, deleteDoc, doc, getDoc, setDoc, query, where, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ==================== AUTH ====================
const dashboardAuth = (() => {
    const login = async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('login-error');
        const btn = document.getElementById('btn-login');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>\u0110ang x\u00e1c th\u1ef1c...';
        errorEl.style.display = 'none';

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            errorEl.textContent = getErrorMessage(err.code);
            errorEl.style.display = 'block';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-1"></i>\u0110\u0103ng nh\u1eadp';
    };

    const logout = async () => {
        if (!confirm('B\u1ea1n ch\u1eafc ch\u1eafn mu\u1ed1n \u0111\u0103ng xu\u1ea5t?')) return;
        await signOut(auth);
    };

    const getErrorMessage = (code) => {
        switch (code) {
            case 'auth/user-not-found': return 'T\u00e0i kho\u1ea3n kh\u00f4ng t\u1ed3n t\u1ea1i';
            case 'auth/wrong-password': return 'M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang';
            case 'auth/invalid-email': return 'Email kh\u00f4ng h\u1ee3p l\u1ec7';
            case 'auth/invalid-credential': return 'Th\u00f4ng tin \u0111\u0103ng nh\u1eadp kh\u00f4ng \u0111\u00fang';
            case 'auth/too-many-requests': return 'Qu\u00e1 nhi\u1ec1u l\u1ea7n th\u1eed. Vui l\u00f2ng \u0111\u1ee3i.';
            default: return 'L\u1ed7i \u0111\u0103ng nh\u1eadp. Vui l\u00f2ng th\u1eed l\u1ea1i.';
        }
    };

    return { login, logout };
})();

// ==================== STATS ====================
const dashboardStats = (() => {
    const load = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'comments'));
            let totalComments = 0;
            let totalLikes = 0;
            let present = 0;
            let absent = 0;

            snapshot.docs.forEach((d) => {
                const data = d.data();
                totalComments++;
                totalLikes += data.likes || 0;
                if (data.parentId === null) {
                    if (data.presence === true) present++;
                    else absent++;
                }
            });

            document.getElementById('stat-comments').textContent = totalComments;
            document.getElementById('stat-likes').textContent = totalLikes;
            document.getElementById('stat-present').textContent = present;
            document.getElementById('stat-absent').textContent = absent;
        } catch (err) {
            console.error('L\u1ed7i t\u1ea3i stats:', err);
        }
    };

    return { load };
})();

// ==================== COMMENTS MANAGEMENT ====================
const dashboardComments = (() => {
    let allComments = [];

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const load = async () => {
        try {
            const snapshot = await getDocs(query(
                collection(db, 'comments'),
                orderBy('createdAt', 'desc')
            ));

            allComments = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));

            renderTable(allComments);
            renderRecent(allComments.slice(0, 5));
        } catch (err) {
            console.error('L\u1ed7i t\u1ea3i comments:', err);
        }
    };

    const renderTable = (comments) => {
        const tbody = document.getElementById('comments-table-body');
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-4">Ch\u01b0a c\u00f3 l\u1eddi ch\u00fac n\u00e0o</td></tr>';
            return;
        }

        tbody.innerHTML = comments.map((c) => `
            <tr>
                <td class="ps-4">
                    <span class="fw-semibold">${escapeHtml(c.name)}</span>
                    ${c.isAdmin ? '<i class="fa-solid fa-certificate text-primary ms-1"></i>' : ''}
                    ${c.parentId ? '<span class="badge bg-secondary ms-1">Tr\u1ea3 l\u1eddi</span>' : ''}
                </td>
                <td style="max-width: 300px;">
                    <span class="text-truncate d-inline-block" style="max-width: 280px;">${escapeHtml(c.comment)}</span>
                </td>
                <td class="text-center">
                    ${c.parentId ? '<span class="text-muted">-</span>' : (c.presence ? '<i class="fa-solid fa-circle-check text-success"></i>' : '<i class="fa-solid fa-circle-xmark text-danger"></i>')}
                </td>
                <td class="text-center">${c.likes || 0}</td>
                <td><small class="text-muted">${formatDate(c.createdAt)}</small></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger rounded-3 py-0" onclick="dashboardComments.remove('${c.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    const renderRecent = (comments) => {
        const container = document.getElementById('recent-comments');
        if (comments.length === 0) {
            container.innerHTML = '<div class="text-center text-muted p-4">Ch\u01b0a c\u00f3 l\u1eddi ch\u00fac n\u00e0o</div>';
            return;
        }

        container.innerHTML = '<div class="list-group list-group-flush">' +
            comments.map((c) => `
                <div class="list-group-item px-4 py-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${escapeHtml(c.name)}</strong>
                            ${c.isAdmin ? '<i class="fa-solid fa-certificate text-primary ms-1"></i>' : ''}
                            ${!c.parentId ? (c.presence ? '<i class="fa-solid fa-circle-check text-success ms-1"></i>' : '<i class="fa-solid fa-circle-xmark text-danger ms-1"></i>') : ''}
                        </div>
                        <small class="text-muted">${formatDate(c.createdAt)}</small>
                    </div>
                    <p class="mb-0 mt-1 text-muted" style="font-size: 0.9rem;">${escapeHtml(c.comment)}</p>
                </div>
            `).join('') +
            '</div>';
    };

    const remove = async (id) => {
        if (!confirm('B\u1ea1n ch\u1eafc ch\u1eafn mu\u1ed1n x\u00f3a l\u1eddi ch\u00fac n\u00e0y?')) return;

        try {
            await deleteDoc(doc(db, 'comments', id));
            allComments = allComments.filter((c) => c.id !== id);
            renderTable(allComments);
            renderRecent(allComments.slice(0, 5));
            dashboardStats.load();
        } catch (err) {
            alert('L\u1ed7i: ' + err.message);
        }
    };

    const search = (keyword) => {
        const kw = keyword.toLowerCase().trim();
        if (!kw) {
            renderTable(allComments);
            return;
        }
        const filtered = allComments.filter((c) =>
            c.name?.toLowerCase().includes(kw) || c.comment?.toLowerCase().includes(kw)
        );
        renderTable(filtered);
    };

    const refresh = async () => {
        await load();
        dashboardStats.load();
    };

    const exportCSV = () => {
        if (allComments.length === 0) {
            alert('Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u \u0111\u1ec3 xu\u1ea5t');
            return;
        }

        const header = 'T\u00ean,L\u1eddi ch\u00fac,Tham d\u1ef1,Likes,Th\u1eddi gian\n';
        const rows = allComments
            .filter((c) => !c.parentId)
            .map((c) => {
                const name = `"${(c.name || '').replace(/"/g, '""')}"`;
                const comment = `"${(c.comment || '').replace(/"/g, '""')}"`;
                const presence = c.presence ? 'C\u00f3' : 'Kh\u00f4ng';
                const likes = c.likes || 0;
                const date = formatDate(c.createdAt);
                return `${name},${comment},${presence},${likes},${date}`;
            }).join('\n');

        const bom = '\uFEFF';
        const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `loichuc_thinhthu_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return { load, remove, search, refresh, exportCSV };
})();

// ==================== GUESTS ====================
const dashboardGuests = (() => {
    let allGuests = [];
    let currentFilter = 'all';

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const load = async () => {
        try {
            const snapshot = await getDocs(query(
                collection(db, 'comments'),
                where('parentId', '==', null),
                orderBy('createdAt', 'desc')
            ));

            allGuests = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }));

            renderTable(allGuests);
        } catch (err) {
            console.error('L\u1ed7i t\u1ea3i guests:', err);
        }
    };

    const renderTable = (guests) => {
        const tbody = document.getElementById('guests-table-body');
        if (guests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">Ch\u01b0a c\u00f3 kh\u00e1ch m\u1eddi n\u00e0o</td></tr>';
            return;
        }

        tbody.innerHTML = guests.map((g, i) => `
            <tr>
                <td class="ps-4 text-muted">${i + 1}</td>
                <td class="fw-semibold">${escapeHtml(g.name)}</td>
                <td class="text-center">
                    ${g.presence
                        ? '<span class="badge rounded-pill bg-success-subtle text-success">S\u1ebd tham d\u1ef1</span>'
                        : '<span class="badge rounded-pill bg-danger-subtle text-danger">Ch\u01b0a ch\u1eafc</span>'
                    }
                </td>
                <td><small class="text-muted">${formatDate(g.createdAt)}</small></td>
            </tr>
        `).join('');
    };

    const filter = (type, evt) => {
        currentFilter = type;

        document.querySelectorAll('#tab-guests .nav-link').forEach((btn) => btn.classList.remove('active'));
        evt.target.closest('.nav-link').classList.add('active');

        if (type === 'all') {
            renderTable(allGuests);
        } else if (type === 'present') {
            renderTable(allGuests.filter((g) => g.presence === true));
        } else {
            renderTable(allGuests.filter((g) => g.presence !== true));
        }
    };

    return { load, filter };
})();

// ==================== SETTINGS ====================
const dashboardSettings = (() => {
    const load = async () => {
        try {
            const configDoc = await getDoc(doc(db, 'config', 'settings'));
            if (configDoc.exists()) {
                const data = configDoc.data();
                document.getElementById('setting-reply').checked = data.can_reply !== false;
                document.getElementById('setting-edit').checked = data.can_edit !== false;
                document.getElementById('setting-delete').checked = data.can_delete !== false;
            }
        } catch (err) {
            console.error('L\u1ed7i t\u1ea3i settings:', err);
        }
    };

    const save = async () => {
        try {
            await setDoc(doc(db, 'config', 'settings'), {
                can_reply: document.getElementById('setting-reply').checked,
                can_edit: document.getElementById('setting-edit').checked,
                can_delete: document.getElementById('setting-delete').checked,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            alert('L\u1ed7i l\u01b0u c\u00e0i \u0111\u1eb7t: ' + err.message);
        }
    };

    const clearAllComments = async () => {
        if (!confirm('B\u1ea1n ch\u1eafc ch\u1eafn mu\u1ed1n X\u00d3A T\u1ea4T C\u1ea2 b\u00ecnh lu\u1eadn? H\u00e0nh \u0111\u1ed9ng n\u00e0y KH\u00d4NG TH\u1ec2 ho\u00e0n t\u00e1c!')) return;
        if (!confirm('X\u00e1c nh\u1eadn l\u1ea7n cu\u1ed1i: X\u00f3a t\u1ea5t c\u1ea3?')) return;

        try {
            const snapshot = await getDocs(collection(db, 'comments'));
            const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'comments', d.id)));
            await Promise.all(deletePromises);

            alert('\u0110\u00e3 x\u00f3a t\u1ea5t c\u1ea3 b\u00ecnh lu\u1eadn!');
            dashboardComments.refresh();
        } catch (err) {
            alert('L\u1ed7i: ' + err.message);
        }
    };

    return { load, save, clearAllComments };
})();

// ==================== AUTH STATE ====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (modal) modal.hide();

        document.getElementById('app-container').style.display = 'block';
        document.getElementById('admin-email').textContent = user.email;
        document.getElementById('settings-admin-email').textContent = user.email;

        dashboardStats.load();
        dashboardComments.load();
        dashboardGuests.load();
        dashboardSettings.load();
    } else {
        document.getElementById('app-container').style.display = 'none';
        (new bootstrap.Modal(document.getElementById('loginModal'))).show();
    }
});

// ==================== EXPOSE TO WINDOW ====================
window.dashboardAuth = dashboardAuth;
window.dashboardComments = dashboardComments;
window.dashboardGuests = dashboardGuests;
window.dashboardSettings = dashboardSettings;
