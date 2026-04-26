import { db, auth } from './firebase-config.js';
import {
    collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAfter, serverTimestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { card } from './card.js';
import { util } from './util.js';
import { theme } from './theme.js';
import { storage } from './storage.js';
import { pagination } from './pagination.js';

export const comment = (() => {

    const owns = storage('owns');
    const config = storage('config');
    const pageDocCache = {};

    const clearPageCache = () => {
        Object.keys(pageDocCache).forEach((k) => delete pageDocCache[k]);
    };

    const remove = async (button) => {
        if (!confirm('Bạn chắc chắn chưa?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');
        const btn = util.disableButton(button);

        try {
            await deleteDoc(doc(db, 'comments', id));
            const el = document.getElementById(id);
            if (el) el.remove();
            owns.unset(id);
            clearPageCache();
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message);
        }

        btn.restore();
    };

    const changeButton = (id, disabled) => {
        const buttonMethod = ['reply', 'edit', 'remove'];
        buttonMethod.forEach((v) => {
            const status = document.querySelector(`[onclick="comment.${v}(this)"][data-uuid="${id}"]`);
            if (status) {
                status.disabled = disabled;
            }
        });
    };

    const update = async (button) => {
        const id = button.getAttribute('data-uuid');

        const presence = document.getElementById(`form-inner-presence-${id}`);
        if (presence) {
            presence.disabled = true;
        }

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) {
            cancel.disabled = true;
        }

        const btn = util.disableButton(button);

        try {
            const updateData = { comment: form.value, updatedAt: serverTimestamp() };
            if (presence) {
                updateData.presence = presence.value === "1";
            }
            await updateDoc(doc(db, 'comments', id), updateData);

            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();

            clearPageCache();
            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('Lỗi khi cập nhật: ' + err.message);
        }
    };

    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        if (name.value.length == 0) {
            alert('Vui lòng điền tên của bạn');
            return;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value == "0") {
            alert('Vui lòng lựa chọn bạn có thể tham dự đám cưới của chúng tôi hay không?');
            return;
        }

        if (!auth.currentUser) {
            alert('Đang kết nối, vui lòng thử lại sau giây lát.');
            return;
        }

        if (presence) presence.disabled = true;

        const form = document.getElementById(`form-${id ? `inner-${id}` : 'comment'}`);
        form.disabled = true;

        const cancel = document.querySelector(`[onclick="comment.cancel('${id}')"]`);
        if (cancel) cancel.disabled = true;

        const btn = util.disableButton(button);

        try {
            const commentData = {
                name: name.value,
                comment: form.value,
                presence: presence ? presence.value === "1" : true,
                parentId: id || null,
                likes: 0,
                isAdmin: false,
                ownerId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'comments'), commentData);
            owns.set(docRef.id, true);

            form.value = '';
            if (presence) presence.value = "0";

            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();

            if (id) {
                changeButton(id, false);
                const innerEl = document.getElementById(`inner-${id}`);
                if (innerEl) innerEl.remove();
            }

            clearPageCache();
            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('Lỗi khi gửi: ' + err.message);
        }
    };

    const cancel = (id) => {
        if (document.getElementById(`form-inner-${id}`).value.length === 0 || confirm('Bạn chắc chắn chưa?')) {
            changeButton(id, false);
            document.getElementById(`inner-${id}`).remove();
        }
    };

    const reply = (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);

        const inner = document.createElement('div');
        inner.classList.add('my-2');
        inner.id = `inner-${id}`;
        inner.innerHTML = `
        <label for="form-inner-${id}" class="form-label">Trả lời</label>
        <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nhập phản hồi lời chúc mừng"></textarea>
        <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">Hủy bỏ</button>
            <button style="font-size: 0.8rem;" onclick="comment.send(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">Gửi</button>
        </div>`;

        document.getElementById(`button-${id}`).insertAdjacentElement('afterend', inner);
    };

    const edit = async (button) => {
        const id = button.getAttribute('data-uuid');

        if (document.getElementById(`inner-${id}`)) {
            return;
        }

        changeButton(id, true);
        const tmp = button.innerText;
        button.innerText = 'Loading..';

        try {
            const docSnap = await getDoc(doc(db, 'comments', id));

            if (docSnap.exists()) {
                const data = docSnap.data();
                const inner = document.createElement('div');
                inner.classList.add('my-2');
                inner.id = `inner-${id}`;
                inner.innerHTML = `
                <label for="form-inner-${id}" class="form-label">Sửa</label>
                ${document.getElementById(id).getAttribute('data-parent') === 'true' ? `
                <select class="form-select shadow-sm mb-2" id="form-inner-presence-${id}">
                    <option value="1" ${data.presence ? 'selected' : ''}>Chắc chắn có mặt</option>
                    <option value="2" ${data.presence ? '' : 'selected'}>Chưa chắc chắn</option>
                </select>` : ''}
                <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nhập nội dung cập nhật"></textarea>
                <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
                    <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">Hủy bỏ</button>
                    <button style="font-size: 0.8rem;" onclick="comment.update(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">Cập nhật</button>
                </div>`;

                document.getElementById(`button-${id}`).insertAdjacentElement('afterend', inner);
                document.getElementById(`form-inner-${id}`).value = data.comment;
            } else {
                changeButton(id, false);
                alert('Bình luận không còn tồn tại.');
            }
        } catch (err) {
            changeButton(id, false);
            alert('Lỗi: ' + err.message);
        }

        button.innerText = tmp;
    };

    const fetchComments = async () => {
        card.renderLoading();

        try {
            const perPage = pagination.getPer();
            const nextStart = pagination.getNext();
            const pageIndex = perPage > 0 ? Math.floor(nextStart / perPage) : 0;

            let q;

            if (pageIndex === 0) {
                q = query(
                    collection(db, 'comments'),
                    where('parentId', '==', null),
                    orderBy('createdAt', 'desc'),
                    limit(perPage)
                );
            } else if (pageDocCache[pageIndex - 1]) {
                q = query(
                    collection(db, 'comments'),
                    where('parentId', '==', null),
                    orderBy('createdAt', 'desc'),
                    startAfter(pageDocCache[pageIndex - 1]),
                    limit(perPage)
                );
            } else {
                const skipQuery = query(
                    collection(db, 'comments'),
                    where('parentId', '==', null),
                    orderBy('createdAt', 'desc'),
                    limit(nextStart)
                );
                const skipSnap = await getDocs(skipQuery);
                const docs = skipSnap.docs;
                if (docs.length > 0) {
                    const lastDoc = docs[docs.length - 1];
                    pageDocCache[pageIndex - 1] = lastDoc;
                    q = query(
                        collection(db, 'comments'),
                        where('parentId', '==', null),
                        orderBy('createdAt', 'desc'),
                        startAfter(lastDoc),
                        limit(perPage)
                    );
                } else {
                    q = query(
                        collection(db, 'comments'),
                        where('parentId', '==', null),
                        orderBy('createdAt', 'desc'),
                        limit(perPage)
                    );
                }
            }

            const snapshot = await getDocs(q);
            const comments = document.getElementById('comments');
            pagination.setResultData(snapshot.docs.length);

            if (snapshot.docs.length > 0) {
                pageDocCache[pageIndex] = snapshot.docs[snapshot.docs.length - 1];
            }

            if (snapshot.docs.length === 0) {
                comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow">Hãy là người đầu tiên gửi lời chúc nhé!</div>`;
                return;
            }

            const parentComments = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const parentComment = {
                    uuid: docSnap.id,
                    name: data.name,
                    comment: data.comment,
                    presence: data.presence,
                    likes: data.likes || 0,
                    like: { love: data.likes || 0 },
                    is_admin: data.isAdmin || false,
                    ownerId: data.ownerId || null,
                    created_at: data.createdAt ? formatDate(data.createdAt.toDate()) : '',
                    comments: []
                };

                const repliesQuery = query(
                    collection(db, 'comments'),
                    where('parentId', '==', docSnap.id),
                    orderBy('createdAt', 'asc')
                );
                const repliesSnap = await getDocs(repliesQuery);
                parentComment.comments = repliesSnap.docs.map((r) => {
                    const rd = r.data();
                    return {
                        uuid: r.id,
                        name: rd.name,
                        comment: rd.comment,
                        presence: rd.presence,
                        likes: rd.likes || 0,
                        like: { love: rd.likes || 0 },
                        is_admin: rd.isAdmin || false,
                        ownerId: rd.ownerId || null,
                        created_at: rd.createdAt ? formatDate(rd.createdAt.toDate()) : '',
                        comments: []
                    };
                });

                parentComments.push(parentComment);
            }

            comments.innerHTML = parentComments.map((c) => card.renderContent(c)).join('');
        } catch (err) {
            console.error('Lỗi tải comments:', err);
            const comments = document.getElementById('comments');
            comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow text-danger">Lỗi tải dữ liệu. Vui lòng thử lại.</div>`;
        }
    };

    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    return {
        cancel,
        send,
        edit,
        reply,
        remove,
        update,
        comment: fetchComments,
        renderLoading: card.renderLoading,
    };
})();
