class ObjectPool {
    constructor(factory, initialSize = 0) {
        this.factory = factory;
        this.pool = [];
        this.inUse = new Set();
        
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory();
        }
        this.inUse.add(obj);
        return obj;
    }

    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            if (typeof obj.reset === 'function') obj.reset();
            this.pool.push(obj);
        }
    }

    releaseAll() {
        for (const obj of this.inUse) {
            if (typeof obj.reset === 'function') obj.reset();
            this.pool.push(obj);
        }
        this.inUse.clear();
    }
}

module.exports = ObjectPool;
