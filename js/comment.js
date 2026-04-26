import { db } from './firebase-config.js';
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

    const remove = async (button) => {
        if (!confirm('B\u1ea1n ch\u1eafc ch\u1eafn ch\u01b0a?')) {
            return;
        }

        const id = button.getAttribute('data-uuid');
        const btn = util.disableButton(button);

        try {
            await deleteDoc(doc(db, 'comments', id));
            const el = document.getElementById(id);
            if (el) el.remove();
            owns.unset(id);
        } catch (err) {
            alert('L\u1ed7i khi x\u00f3a: ' + err.message);
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

            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('L\u1ed7i khi c\u1eadp nh\u1eadt: ' + err.message);
        }
    };

    const send = async (button) => {
        const id = button.getAttribute('data-uuid');

        const name = document.getElementById('form-name');
        if (name.value.length == 0) {
            alert('Vui l\u00f2ng \u0111i\u1ec1n t\u00ean c\u1ee7a b\u1ea1n');
            return;
        }

        const presence = document.getElementById('form-presence');
        if (!id && presence && presence.value == "0") {
            alert('Vui l\u00f2ng l\u1ef1a ch\u1ecdn b\u1ea1n c\u00f3 th\u1ec3 tham d\u1ef1 \u0111\u00e1m c\u01b0\u1edbi c\u1ee7a ch\u00fang t\u00f4i hay kh\u00f4ng?');
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

            fetchComments();
        } catch (err) {
            form.disabled = false;
            if (cancel) cancel.disabled = false;
            if (presence) presence.disabled = false;
            btn.restore();
            alert('L\u1ed7i khi g\u1eedi: ' + err.message);
        }
    };

    const cancel = (id) => {
        if (document.getElementById(`form-inner-${id}`).value.length === 0 || confirm('B\u1ea1n ch\u1eafc ch\u1eafn ch\u01b0a?')) {
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
        <label for="form-inner-${id}" class="form-label">Tr\u1ea3 l\u1eddi</label>
        <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nh\u1eadp ph\u1ea3n h\u1ed3i l\u1eddi ch\u00fac m\u1eebng"></textarea>
        <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
            <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">H\u1ee7y b\u1ecf</button>
            <button style="font-size: 0.8rem;" onclick="comment.send(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">G\u1eedi</button>
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
                <label for="form-inner-${id}" class="form-label">S\u1eeda</label>
                ${document.getElementById(id).getAttribute('data-parent') === 'true' ? `
                <select class="form-select shadow-sm mb-2" id="form-inner-presence-${id}">
                    <option value="1" ${data.presence ? 'selected' : ''}>Ch\u1eafc ch\u1eafn c\u00f3 m\u1eb7t</option>
                    <option value="2" ${data.presence ? '' : 'selected'}>Ch\u01b0a ch\u1eafc ch\u1eafn</option>
                </select>` : ''}
                <textarea class="form-control shadow-sm rounded-3 mb-2" id="form-inner-${id}" placeholder="Nh\u1eadp n\u1ed9i dung c\u1eadp nh\u1eadt"></textarea>
                <div class="d-flex flex-wrap justify-content-end align-items-center mb-0">
                    <button style="font-size: 0.8rem;" onclick="comment.cancel('${id}')" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0 me-1">H\u1ee7y b\u1ecf</button>
                    <button style="font-size: 0.8rem;" onclick="comment.update(this)" data-uuid="${id}" class="btn btn-sm btn-outline-${theme.isDarkMode('light', 'dark')} rounded-3 py-0">C\u1eadp nh\u1eadt</button>
                </div>`;

                document.getElementById(`button-${id}`).insertAdjacentElement('afterend', inner);
                document.getElementById(`form-inner-${id}`).value = data.comment;
            }
        } catch (err) {
            alert('L\u1ed7i: ' + err.message);
        }

        button.innerText = tmp;
    };

    const fetchComments = async () => {
        card.renderLoading();

        try {
            const perPage = pagination.getPer();
            const nextStart = pagination.getNext();

            let q = query(
                collection(db, 'comments'),
                where('parentId', '==', null),
                orderBy('createdAt', 'desc'),
                limit(perPage)
            );

            if (nextStart > 0) {
                const allParents = query(
                    collection(db, 'comments'),
                    where('parentId', '==', null),
                    orderBy('createdAt', 'desc'),
                    limit(nextStart)
                );
                const skipSnap = await getDocs(allParents);
                const docs = skipSnap.docs;
                if (docs.length > 0) {
                    const lastDoc = docs[docs.length - 1];
                    q = query(
                        collection(db, 'comments'),
                        where('parentId', '==', null),
                        orderBy('createdAt', 'desc'),
                        startAfter(lastDoc),
                        limit(perPage)
                    );
                }
            }

            const snapshot = await getDocs(q);
            const comments = document.getElementById('comments');
            pagination.setResultData(snapshot.docs.length);

            if (snapshot.docs.length === 0) {
                comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow">H\u00e3y l\u00e0 ng\u01b0\u1eddi \u0111\u1ea7u ti\u00ean g\u1eedi l\u1eddi ch\u00fac nh\u00e9!</div>`;
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
                        created_at: rd.createdAt ? formatDate(rd.createdAt.toDate()) : '',
                        comments: []
                    };
                });

                parentComments.push(parentComment);
            }

            comments.innerHTML = parentComments.map((c) => card.renderContent(c)).join('');
        } catch (err) {
            console.error('L\u1ed7i t\u1ea3i comments:', err);
            const comments = document.getElementById('comments');
            comments.innerHTML = `<div class="h6 text-center fw-bold p-4 my-3 bg-theme-${theme.isDarkMode('dark', 'light')} rounded-4 shadow text-danger">L\u1ed7i t\u1ea3i d\u1eef li\u1ec7u. Vui l\u00f2ng th\u1eed l\u1ea1i.</div>`;
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
