/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as gulp from 'gulp';
import * as path from 'path';
import {
    codeExtensionPath,
    omnisharpFeatureTestRunnerPath,
    mochaPath,
    rootPath,
    omnisharpTestAssetsRootPath,
    omnisharpTestRootPath,
    testRootPath,
    integrationTestRunnerPath,
    jestPath,
} from './projectPaths';
import spawnNode from './spawnNode';

gulp.task('omnisharptest:feature', async () => {
    const env = {
        OSVC_SUITE: 'omnisharpFeatureTests',
        CODE_EXTENSIONS_PATH: codeExtensionPath,
        CODE_TESTS_PATH: path.join(omnisharpTestRootPath, 'omnisharpFeatureTests'),
        CODE_WORKSPACE_ROOT: rootPath,
        CODE_DISABLE_EXTENSIONS: 'true',
    };

    const result = await spawnNode([omnisharpFeatureTestRunnerPath], { env });

    if (result.code === null || result.code > 0) {
        // Ensure that gulp fails when tests fail
        throw new Error(`Exit code: ${result.code}  Signal: ${result.signal}`);
    }

    return result;
});

gulp.task('omnisharptest:unit', async () => {
    const result = await spawnNode([
        mochaPath,
        '--ui',
        'tdd',
        '-c',
        'out/omnisharptest/omnisharpUnitTests/**/*.test.js',
    ]);

    if (result.code === null || result.code > 0) {
        // Ensure that gulp fails when tests fail
        throw new Error(`Exit code: ${result.code}  Signal: ${result.signal}`);
    }

    return result;
});

gulp.task('omnisharp:jest:test', async () => {
    runJestTest(/.*omnisharpJestTests.*/);
});

const projectNames = ['singleCsproj', 'slnWithCsproj', 'slnFilterWithCsproj', 'BasicRazorApp2_1'];

for (const projectName of projectNames) {
    gulp.task(`omnisharptest:integration:${projectName}:stdio`, async () =>
        runOmnisharpIntegrationTest(projectName, 'stdio')
    );
    gulp.task(`omnisharptest:integration:${projectName}:lsp`, async () =>
        runOmnisharpIntegrationTest(projectName, 'lsp')
    );
    gulp.task(
        `omnisharptest:integration:${projectName}`,
        gulp.series(`omnisharptest:integration:${projectName}:stdio`, `omnisharptest:integration:${projectName}:lsp`)
    );
}

gulp.task(
    'omnisharptest:integration',
    gulp.series(projectNames.map((projectName) => `omnisharptest:integration:${projectName}`))
);
gulp.task(
    'omnisharptest:integration:stdio',
    gulp.series(projectNames.map((projectName) => `omnisharptest:integration:${projectName}:stdio`))
);
gulp.task(
    'omnisharptest:integration:lsp',
    gulp.series(projectNames.map((projectName) => `omnisharptest:integration:${projectName}:lsp`))
);
// TODO: Enable lsp integration tests once tests for unimplemented features are disabled.
gulp.task(
    'omnisharptest',
    gulp.series('omnisharp:jest:test', 'omnisharptest:feature', 'omnisharptest:unit', 'omnisharptest:integration:stdio')
);

gulp.task('test:integration:slnWithCsproj', async () => runIntegrationTest('slnWithCsproj'));

gulp.task('test:unit', async () => {
    runJestTest(/unitTests.*\.ts/);
});

gulp.task('test', gulp.series('test:unit'));

async function runOmnisharpIntegrationTest(testAssetName: string, engine: 'stdio' | 'lsp') {
    const workspaceFile = `omnisharp${engine === 'lsp' ? '_lsp' : ''}_${testAssetName}.code-workspace`;
    const workspacePath = path.join(omnisharpTestAssetsRootPath, testAssetName, '.vscode', workspaceFile);
    const codeTestsPath = path.join(omnisharpTestRootPath, 'omnisharpIntegrationTests');

    const env = {
        OSVC_SUITE: testAssetName,
        CODE_TESTS_PATH: codeTestsPath,
        CODE_EXTENSIONS_PATH: codeExtensionPath,
        CODE_TESTS_WORKSPACE: workspacePath,
        CODE_WORKSPACE_ROOT: rootPath,
        EXTENSIONS_TESTS_PATH: path.join(codeTestsPath, 'index.js'),
        OMNISHARP_ENGINE: engine,
        OMNISHARP_LOCATION: process.env.OMNISHARP_LOCATION,
        CODE_DISABLE_EXTENSIONS: 'true',
    };

    const result = await spawnNode([integrationTestRunnerPath, '--enable-source-maps'], {
        env,
        cwd: rootPath,
    });

    if (result.code === null || result.code > 0) {
        // Ensure that gulp fails when tests fail
        throw new Error(`Exit code: ${result.code}  Signal: ${result.signal}`);
    }

    return result;
}

async function runIntegrationTest(testAssetName: string) {
    const workspacePath = path.join(
        omnisharpTestAssetsRootPath,
        testAssetName,
        '.vscode',
        `lsp_tools_host_${testAssetName}.code-workspace`
    );
    const codeTestsPath = path.join(testRootPath, 'integrationTests');

    const env = {
        OSVC_SUITE: testAssetName,
        CODE_TESTS_PATH: codeTestsPath,
        CODE_EXTENSIONS_PATH: codeExtensionPath,
        CODE_TESTS_WORKSPACE: workspacePath,
        CODE_WORKSPACE_ROOT: rootPath,
        EXTENSIONS_TESTS_PATH: path.join(codeTestsPath, 'index.js'),
        CODE_DISABLE_EXTENSIONS: 'true',
    };

    const result = await spawnNode([integrationTestRunnerPath, '--enable-source-maps'], { env, cwd: rootPath });

    if (result.code === null || result.code > 0) {
        // Ensure that gulp fails when tests fail
        throw new Error(`Exit code: ${result.code}  Signal: ${result.signal}`);
    }

    return result;
}

async function runJestTest(testFilterRegex: RegExp) {
    const result = await spawnNode([jestPath, testFilterRegex.source]);

    if (result.code === null || result.code > 0) {
        // Ensure that gulp fails when tests fail
        throw new Error(`Exit code: ${result.code}  Signal: ${result.signal}`);
    }

    return result;
}
