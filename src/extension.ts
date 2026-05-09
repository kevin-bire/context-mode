import * as vscode from 'vscode';

/**
 * Context Mode - VS Code Extension
 * Provides context-aware editing modes for improved developer productivity.
 */

let statusBarItem: vscode.StatusBarItem;
let isContextModeActive = false;

/**
 * Activates the extension and registers all commands and event listeners.
 * @param context - The VS Code extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Context Mode extension is now active');

  // Create status bar item to show current mode
  // Note: using Left alignment so it's more visible next to language indicator
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = 'context-mode.toggle';
  context.subscriptions.push(statusBarItem);

  // Register toggle command
  const toggleCommand = vscode.commands.registerCommand(
    'context-mode.toggle',
    () => toggleContextMode(context)
  );

  // Register enable command
  const enableCommand = vscode.commands.registerCommand(
    'context-mode.enable',
    () => setContextMode(true, context)
  );

  // Register disable command
  const disableCommand = vscode.commands.registerCommand(
    'context-mode.disable',
    () => setContextMode(false, context)
  );

  context.subscriptions.push(toggleCommand, enableCommand, disableCommand);

  // Restore previous state from workspace state
  const savedState = context.workspaceState.get<boolean>('contextModeActive', false);
  setContextMode(savedState, context);

  // Listen for active editor changes
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => onEditorChange(editor, context),
    null,
    context.subscriptions
  );
}

/**
 * Toggles context mode on or off.
 * @param context - The VS Code extension context
 */
function toggleContextMode(context: vscode.ExtensionContext): void {
  setContextMode(!isContextModeActive, context);
}

/**
 * Sets context mode to a specific state.
 * @param active - Whether context mode should be active
 * @param context - The VS Code extension context
 */
function setContextMode(active: boolean, context: vscode.ExtensionContext): void {
  isContextModeActive = active;

  // Persist state
  context.workspaceState.update('contextModeActive', active);

  // Update VS Code context for keybindings
  vscode.commands.executeCommand(
    'setContext',
    'context-mode.isActive',
    active
  );

  updateStatusBar();

  if (active) {
    applyContextMode();
    vscode.window.showInformationMessage('Context Mode enabled');
  } else {
    removeContextMode();
    vscode.window.showInformationMessage('Context Mode disabled');
  }
}

/**
 * Applies context mode settings to the active editor.
 */
function applyContextMode(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const config = vscode.workspace.getConfiguration('contextMode');
  // Default changed to false - I find the highlighting distracting in most cases
  const highlightContext = config.get<boolean>('highlightContext', false);

  if (highlightContext) {
    // Future: apply context highlighting decorations
  }
}
