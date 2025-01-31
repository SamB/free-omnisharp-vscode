/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import { CSharpExtensionExports } from '../../src/csharpExtensionExports';

export async function activateCSharpExtension(): Promise<void> {
    // Ensure the dependent extension exists - when launching via F5 launch.json we can't install the extension prior to opening vscode.
    const vscodeDotnetRuntimeExtensionId = 'ms-dotnettools.vscode-dotnet-runtime';
    const dotnetRuntimeExtension =
        vscode.extensions.getExtension<CSharpExtensionExports>(vscodeDotnetRuntimeExtensionId);
    if (!dotnetRuntimeExtension) {
        await vscode.commands.executeCommand('workbench.extensions.installExtension', vscodeDotnetRuntimeExtensionId);
        await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }

    const csharpExtension = vscode.extensions.getExtension<CSharpExtensionExports>('muhammad-sammy.csharp');
    if (!csharpExtension) {
        throw new Error('Failed to find installation of muhammad-sammy.csharp');
    }

    // Explicitly await the extension activation even if completed so that we capture any errors it threw during activation.
    await csharpExtension.activate();

    await csharpExtension.exports.initializationFinished();
    console.log('muhammad-sammy.csharp activated');
}

export function isRazorWorkspace(workspace: typeof vscode.workspace) {
    return isGivenSln(workspace, 'BasicRazorApp2_1');
}

export function isSlnWithGenerator(workspace: typeof vscode.workspace) {
    return isGivenSln(workspace, 'slnWithGenerator');
}

function isGivenSln(workspace: typeof vscode.workspace, expectedProjectFileName: string) {
    const primeWorkspace = workspace.workspaceFolders![0];
    const projectFileName = primeWorkspace.uri.fsPath.split(path.sep).pop();

    return projectFileName === expectedProjectFileName;
}
