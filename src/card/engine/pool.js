const os = require('os');
const path = require('path');
const { Worker } = require('worker_threads');

const WORKER_COUNT = Math.max(1, Math.min(3, (os.cpus().length || 2) - 1 || 1));
const WORKER_PATH = path.join(__dirname, 'cardWorker.js');

class CardWorkerPool {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.pending = new Map();
        this.nextId = 1;
        this.initialized = false;
    }

    _init() {
        if (this.initialized) return;
        this.initialized = true;
        for (let i = 0; i < WORKER_COUNT; i++) {
            this._spawn();
        }
    }

    _spawn() {
        const worker = new Worker(WORKER_PATH);
        worker.busy = false;
        worker.currentTaskId = null;

        worker.on('message', (msg) => {
            const p = this.pending.get(msg.id);
            if (!p) return;
            this.pending.delete(msg.id);
            worker.busy = false;
            worker.currentTaskId = null;

            if (msg.ok) {
                p.resolve(msg.buffer ? Buffer.from(msg.buffer) : null);
            } else {
                p.reject(new Error(msg.error || 'Card worker error'));
            }
            this._drain();
        });

        worker.on('error', (err) => {
            const taskId = worker.currentTaskId;
            worker.busy = false;
            worker.currentTaskId = null;
            if (taskId != null) {
                const p = this.pending.get(taskId);
                if (p) {
                    this.pending.delete(taskId);
                    p.reject(err);
                }
            }
            this._drain();
        });

        worker.on('exit', (code) => {
            const idx = this.workers.indexOf(worker);
            if (idx !== -1) this.workers.splice(idx, 1);
            const taskId = worker.currentTaskId;
            if (taskId != null) {
                const p = this.pending.get(taskId);
                if (p) {
                    this.pending.delete(taskId);
                    p.reject(new Error('Card worker exited with code ' + code));
                }
            }
            if (this.initialized) this._spawn();
            this._drain();
        });

        this.workers.push(worker);
    }

    _drain() {
        if (this.taskQueue.length === 0) return;
        const idle = this.workers.find(w => !w.busy);
        if (!idle) return;
        const task = this.taskQueue.shift();
        idle.busy = true;
        idle.currentTaskId = task.id;
        idle.postMessage(task);
    }

    _submit(task) {
        this._init();
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.pending.set(id, { resolve, reject });
            this.taskQueue.push({ id, ...task });
            this._drain();
        });
    }

    generatePlayerCard(accountData, hypixelApiKey, donutApiKey, cardStyle) {
        return this._submit({ type: 'player', accountData, hypixelApiKey, donutApiKey, cardStyle });
    }

    generateInvoiceCard(invoice, qrUrl, accountData) {
        return this._submit({ type: 'invoice', invoice, qrUrl, accountData });
    }
}

const pool = new CardWorkerPool();

module.exports = {
    generatePlayerCard: (accountData, hypixelApiKey, donutApiKey, cardStyle) =>
        pool.generatePlayerCard(accountData, hypixelApiKey, donutApiKey, cardStyle),
    generateInvoiceCard: (invoice, qrUrl, accountData) =>
        pool.generateInvoiceCard(invoice, qrUrl, accountData)
};
