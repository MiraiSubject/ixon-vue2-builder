const fs = require('fs');
const path = require('path');
const { build } = require('vite');
const {
    getRootDir,
    cleanDir,
    watchInputDir,
    writeDemoFile,
    copyAssets,
    watchAssets,
} = require('@ixon-cdk/core');

const { createVuePlugin } = require('vite-plugin-vue2');

async function _build(inputFile, outputFile, tag, assets, production, watch) {
    const inputDir = path.dirname(path.join(getRootDir(), inputFile));
    const outputDir = path.dirname(path.join(getRootDir(), outputFile));
    // temporary entry file
    const entryFileName = path.join(__dirname, `__temp_entry-${tag}.js`);
    const relativeInputPath = path.relative(
        path.dirname(entryFileName),
        path.join(getRootDir(), inputFile),
    );

    const entryFileContent = `import Vue from 'vue';
    import VueCustomElement from 'vue-custom-element';
    import Widget from '${relativeInputPath}';
    Vue.config.ignoredElements = ['${tag}'];
    Vue.use(VueCustomElement);
    const e = Vue.customElement('${tag}', Widget, {
        // Otherwise modal doesn't work???
        shadow: false,
        beforeCreateVueInstance(root) {
            const rootNode = root.el.getRootNode();

            if (rootNode instanceof ShadowRoot) {
                root.shadowRoot = rootNode;
            } else {
                root.shadowRoot = document.head;
            }
            return root;
        }
    // Additional Options: https://github.com/karol-f/vue-custom-element#options
    });
    customElements.get('${tag}') || customElements.define('${tag}', e)
    `;

    fs.writeFileSync(entryFileName, entryFileContent, {
        encoding: 'utf8',
        flag: 'w',
    });


    cleanDir(outputDir);
    writeDemoFile(tag, outputDir, outputFile);

    const config = {
        root: getRootDir(),
        mode: production ? 'production' : 'development',
        resolve: {
            alias: {
                '~@': getRootDir(),
                '@': getRootDir()
            },
        },
        build: {
            lib: {
                entry: entryFileName,
                formats: ['cjs'],
                name: 'app',
                fileName: () => `${tag}.min.js`,
            },
            sourcemap: true,
            outDir: outputDir,
            emptyOutDir: false,
            rollupOptions: {
                output: {
                    inlineDynamicImports: true,
                },
            },
        },
        write: true,
        plugins: [
            createVuePlugin({
                target: 'lib'
            })
        ],
    };

    // build
    await build(config);
    copyAssets(assets, inputDir, outputDir);

    // watch source files
    if (watch) {
        watchAssets(assets, inputDir, outputDir);
        await watchInputDir(inputDir, (isAsset) => {
            if (isAsset) {
                // do nothing
            } else {
                build(config);
            }
        });
        process.on('SIGINT', () => {
            fs.unlinkSync(entryFileName);
            process.exit();
        });
    }
}

module.exports = function runBuild(
    inputFile,
    outputFile,
    tag,
    assets,
    production = true,
    watch = false,
) {
    return _build(inputFile, outputFile, tag, assets, production, watch);
};
