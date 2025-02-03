import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

let originStatusItem: vscode.StatusBarItem;
let lastOriginInfo: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    originStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 999999999);
    context.subscriptions.push(originStatusItem);

    vscode.workspace.onDidChangeWorkspaceFolders(updateOriginStatusItem, null, context.subscriptions);
    vscode.window.onDidChangeActiveTextEditor(updateOriginStatusItem, null, context.subscriptions);

    updateOriginStatusItem();
    originStatusItem.show();
}

function updateOriginStatusItem() {
    const originInfo = getActiveWorkspaceOriginInfo() ?? "user/repo";
    originStatusItem.text = `$(repo) ${originInfo}`;
}

function getActiveWorkspaceOriginInfo(): string | null {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return null;
        }
        let activeWorkspace: vscode.WorkspaceFolder | undefined;
        if (vscode.window.activeTextEditor) {
            activeWorkspace = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
        if (!activeWorkspace && lastOriginInfo) {
            return lastOriginInfo;
        }
        const selectedWorkspace = activeWorkspace ?? workspaceFolders[0];
        let originInfo = getOriginInfo(selectedWorkspace.uri.fsPath);
        lastOriginInfo = originInfo;
        return originInfo;
    } catch (error) {
        console.error("Error getting git origin info:", error);
    }
    return null;
}

function getOriginInfo(workspacePath: string): string | null {
    const gitConfigPath = path.join(workspacePath, ".git", "config");

    if (!fs.existsSync(gitConfigPath)) {
        return null;
    }

    const configContent = fs.readFileSync(gitConfigPath, "utf-8");

    let match = configContent.match(/url = https:\/\/github\.com\/(.+)\.git/);
    if (match) {
        return match[1];
    }

    match = configContent.match(/url = git@github\.com:(.+)\.git/);
    if (match) {
        return match[1];
    }

    return null;
}
