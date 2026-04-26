import config from './api-config.js';

const API_BASE = 'https://api.jsonbin.io/v3';

let cache = null;

const sha256 = async (message) => {
    const buffer = new TextEncoder().encode(message);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const read = async (force = false) => {
    if (cache && !force) return cache;

    const res = await fetch(`${API_BASE}/b/${config.binId}/latest`, {
        headers: {
            'X-Master-Key': config.masterKey,
            'X-Bin-Meta': 'false'
        }
    });

    if (!res.ok) throw new Error('Lỗi đọc dữ liệu từ JSONBin');

    cache = await res.json();

    if (!cache.comments) cache.comments = [];
    if (!cache.config) cache.config = { can_reply: true, can_edit: true, can_delete: true };

    return cache;
};

const write = async (data) => {
    const res = await fetch(`${API_BASE}/b/${config.binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': config.masterKey
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Lỗi ghi dữ liệu lên JSONBin');

    cache = data;
    return data;
};

const update = async (updater) => {
    const data = await read(true);
    const updated = updater(data);
    await write(updated);
    return updated;
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getOwnerId = () => {
    let id = localStorage.getItem('ownerId');
    if (!id) {
        id = generateId();
        localStorage.setItem('ownerId', id);
    }
    return id;
};

export const api = {
    read,
    write,
    update,
    generateId,
    getOwnerId,
    sha256,
    getAdminHash: () => config.adminPasswordHash
};
