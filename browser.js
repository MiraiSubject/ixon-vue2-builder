const fs = require('fs');
const path = require('path');
const {
    getRootDir,
    cleanDir,
    watchInputDir,
    writeDemoFile,
    copyAssets,
    watchAssets,
} = require('@ixon-cdk/core');
const minimist = require('minimist');
const { rename } = require('fs/promises');

const Service = require('@vue/cli-service/lib/Service')

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

    await vueBuild(inputDir, outputDir, entryFileName, outputFile, tag, assets);

    // watch source files
    if (watch) {
        watchAssets(assets, inputDir, outputDir);
        await watchInputDir(inputDir, (isAsset) => {
            if (isAsset) {
                // do nothing
            } else {
                vueBuild(inputDir, outputDir, entryFileName, outputFile, tag, assets);
            }
        });
        process.on('SIGINT', () => {
            fs.unlinkSync(entryFileName);
            process.exit();
        });
    }
}

async function vueBuild(inputDir, outputDir, entryFileName, outputFile, tag, assets) {
    writeDemoFile(tag, outputDir, outputFile);

    const rawArgs = [
        'build',
        '--target',
        'lib',
        '--inline-vue',
        '--dest',
        outputDir,
        '--name',
        tag,
        entryFileName
    ];

    const args = minimist(rawArgs, {
        boolean: [
            // build
            'modern',
            'report',
            'report-json',
            'inline-vue',
            'watch',
            // serve
            'open',
            'copy',
            'https',
            // inspect
            'verbose',
        ],
    });

    const s = new Service(getRootDir());
    const command = args._[0];

    try {
        await s.run(command, args, rawArgs)
    } catch (e) {
        console.error(e)
    }

    // // build
    // await build(config);
    copyAssets(assets, inputDir, outputDir);

    const umdNames = [`${tag}.umd.js`,
    `${tag}.umd.min.js`];

    for (let i = 0; i < umdNames.length; i++) {
        await rename(path.join(outputDir, umdNames[i]), path.join(outputDir, umdNames[i].replace(".umd", "")));
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
