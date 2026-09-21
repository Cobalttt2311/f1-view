

const CONFIG = {
    BACKEND_URL: 'https://f1-api-neon.vercel.app',

    API_PREFIX: '/api/v1',

    get API_BASE() {
        const cleanBase = this.BACKEND_URL.replace(/\/+$/, '');
        const cleanPrefix = this.API_PREFIX.startsWith('/') ? this.API_PREFIX : `/${this.API_PREFIX}`;
        return `${cleanBase}${cleanPrefix}`;
    }
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
