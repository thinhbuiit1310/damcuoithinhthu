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
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xác thực...';
        errorEl.style.display = 'none';

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            errorEl.textContent = getErrorMessage(err.code);
            errorEl.style.display = 'block';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-1"></i>Đăng nhập';
    };

    const logout = async () => {
        if (!confirm('Bạn chắc chắn muốn đăng xuất?')) return;
        await signOut(auth);
    };

    const getErrorMessage = (code) => {
        switch (code) {
            case 'auth/user-not-found': return 'Tài khoản không tồn tại';
            case 'auth/wrong-password': return 'Mật khẩu không đúng';
            case 'auth/invalid-email': return 'Email không hợp lệ';
            case 'auth/invalid-credential': return 'Thông tin đăng nhập không đúng';
            case 'auth/too-many-requests': return 'Quá nhiều lần thử. Vui lòng đợi.';
            default: return 'Lỗi đăng nhập. Vui lòng thử lại.';
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
            console.error('Lỗi tải stats:', err);
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
            console.error('Lỗi tải comments:', err);
        }
    };

    const renderTable = (comments) => {
        const tbody = document.getElementById('comments-table-body');
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-4">Chưa có lời chúc nào</td></tr>';
            return;
        }

        tbody.innerHTML = comments.map((c) => `
            <tr>
                <td class="ps-4">
                    <span class="fw-semibold">${escapeHtml(c.name)}</span>
                    ${c.isAdmin ? '<i class="fa-solid fa-certificate text-primary ms-1"></i>' : ''}
                    ${c.parentId ? '<span class="badge bg-secondary ms-1">Trả lời</span>' : ''}
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
            container.innerHTML = '<div class="text-center text-muted p-4">Chưa có lời chúc nào</div>';
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
        if (!confirm('Bạn chắc chắn muốn xóa lời chúc này?')) return;

        try {
            await deleteDoc(doc(db, 'comments', id));
            allComments = allComments.filter((c) => c.id !== id);
            renderTable(allComments);
            renderRecent(allComments.slice(0, 5));
            dashboardStats.load();
        } catch (err) {
            alert('Lỗi: ' + err.message);
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
            alert('Không có dữ liệu để xuất');
            return;
        }

        const header = 'Tên,Lời chúc,Tham dự,Likes,Thời gian\n';
        const rows = allComments
            .filter((c) => !c.parentId)
            .map((c) => {
                const name = `"${(c.name || '').replace(/"/g, '""')}"`;
                const comment = `"${(c.comment || '').replace(/"/g, '""')}"`;
                const presence = c.presence ? 'Có' : 'Không';
                const likes = c.likes || 0;
                const date = formatDate(c.createdAt);
                return `${name},${comment},${presence},${likes},${date}`;
            }).join('\n');

        const bom = '﻿';
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
            console.error('Lỗi tải guests:', err);
        }
    };

    const renderTable = (guests) => {
        const tbody = document.getElementById('guests-table-body');
        if (guests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">Chưa có khách mời nào</td></tr>';
            return;
        }

        tbody.innerHTML = guests.map((g, i) => `
            <tr>
                <td class="ps-4 text-muted">${i + 1}</td>
                <td class="fw-semibold">${escapeHtml(g.name)}</td>
                <td class="text-center">
                    ${g.presence
                        ? '<span class="badge rounded-pill bg-success-subtle text-success">Sẽ tham dự</span>'
                        : '<span class="badge rounded-pill bg-danger-subtle text-danger">Chưa chắc</span>'
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
            console.error('Lỗi tải settings:', err);
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
            alert('Lỗi lưu cài đặt: ' + err.message);
        }
    };

    const clearAllComments = async () => {
        if (!confirm('Bạn chắc chắn muốn XÓA TẤT CẢ bình luận? Hành động này KHÔNG THỂ hoàn tác!')) return;
        if (!confirm('Xác nhận lần cuối: Xóa tất cả?')) return;

        try {
            const snapshot = await getDocs(collection(db, 'comments'));
            const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'comments', d.id)));
            await Promise.all(deletePromises);

            alert('Đã xóa tất cả bình luận!');
            dashboardComments.refresh();
        } catch (err) {
            alert('Lỗi: ' + err.message);
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
