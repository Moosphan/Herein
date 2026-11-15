var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
var buildOut = process.env.MYDASHBOARD_BUILD_OUT;
export default defineConfig({
    main: {
        build: __assign(__assign({}, (buildOut ? { outDir: resolve(buildOut, 'main') } : {})), { rollupOptions: {
                input: {
                    index: resolve('src/main/index.ts'),
                    'codex-session-usage-worker': resolve('src/main/services/codex-session-usage-worker.ts'),
                },
            } }),
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@shared': resolve('src/shared'),
            },
        },
    },
    preload: {
        build: buildOut ? { outDir: resolve(buildOut, 'preload') } : {},
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@shared': resolve('src/shared'),
            },
        },
    },
    renderer: {
        build: buildOut ? { outDir: resolve(buildOut, 'renderer') } : {},
        resolve: {
            alias: {
                '@': resolve('src/renderer'),
                '@shared': resolve('src/shared'),
                '@root': resolve('.'),
            },
        },
        plugins: [react()],
    },
});
