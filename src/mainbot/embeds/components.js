class ContainerBuilder {
    constructor() {
        this.data = { type: 17, components: [] };
    }
    addComponents(...components) {
        this.data.components.push(...components.map(c => (c && c.toJSON ? c.toJSON() : c)));
        return this;
    }
    toJSON() {
        return this.data;
    }
}

class SectionBuilder {
    constructor() {
        this.data = { type: 9, components: [] };
    }
    addComponents(...components) {
        this.data.components.push(...components.map(c => (c && c.toJSON ? c.toJSON() : c)));
        return this;
    }
    setAccessory(accessory) {
        this.data.accessory = accessory && accessory.toJSON ? accessory.toJSON() : accessory;
        return this;
    }
    toJSON() {
        return this.data;
    }
}

class TextDisplayBuilder {
    constructor() {
        this.data = { type: 10 };
    }
    setContent(content) {
        this.data.content = content;
        return this;
    }
    toJSON() {
        return this.data;
    }
}

class SeparatorBuilder {
    constructor() {
        this.data = { type: 14 };
    }
    toJSON() {
        return this.data;
    }
}

class ThumbnailBuilder {
    constructor(isGallery = false) {
        this.data = { type: isGallery ? 12 : 11 };
    }
    setURL(url) {
        if (this.data.type === 12) {
            this.data.media = { url };
            this.data.items = [{ media: { url } }];
        } else {
            this.data.url = url;
            this.data.media = { url };
        }
        return this;
    }
    toJSON() {
        return this.data;
    }
}

module.exports = {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder
};
