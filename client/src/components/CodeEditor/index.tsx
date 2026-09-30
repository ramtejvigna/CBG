"use client";

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from 'monaco-editor';
import { useThemeStore } from "@/lib/store/themeStore";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    theme?: string;
    readOnly?: boolean;
    height?: string;
    /**
     * Text at the very end of `value` that the user must not be able to change,
     * e.g. the judge code that reads the test case and prints the answer. The rest
     * of the file stays fully editable. Monaco has no per-range read-only support,
     * so any edit that would alter this text is rolled back (typing, paste, cut,
     * drag and drop, select-all and delete, ...).
     */
    lockedSuffix?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language,
    theme: editorTheme,
    readOnly = false,
    lockedSuffix = "",
}) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const refreshLockRef = useRef<() => void>(() => { });
    const { theme: appTheme } = useThemeStore();

    // The handlers registered on mount outlive a single render, so they read the
    // latest props through refs instead of closing over stale ones.
    const lockedSuffixRef = useRef(lockedSuffix);
    lockedSuffixRef.current = lockedSuffix;
    const valueRef = useRef(value);
    valueRef.current = value ?? "";

    // Map language to monaco editor language
    const getMonacoLanguage = (lang?: string): string => {
        const languageMap: { [key: string]: string } = {
            javascript: "javascript",
            python: "python",
            java: "java",
            c: "c",
            "c++": "cpp",
        };

        return languageMap[lang?.toLowerCase() || ""] || lang?.toLowerCase() || "";
    };

    // Handle editor mount
    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorRef.current = editor;

        // Configure editor settings
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            automaticLayout: true,
        });

        // Add custom keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Save code (if needed)
            console.log("Save shortcut triggered");
        });

        const model = editor.getModel();
        if (!model) return;

        // The lock compares plain strings, so line endings must always be "\n"
        model.setEOL(monaco.editor.EndOfLineSequence.LF);
        const LF = monaco.editor.EndOfLinePreference.LF;

        const isIntact = (text: string) => {
            const suffix = lockedSuffixRef.current;
            return !suffix || text.endsWith(suffix);
        };

        // Shade the locked lines and mark them with a padlock
        const decorations = editor.createDecorationsCollection();
        const refreshDecorations = () => {
            const suffix = lockedSuffixRef.current;
            const text = model.getValue(LF);
            if (!suffix || !text.endsWith(suffix)) {
                decorations.clear();
                return;
            }
            const start = model.getPositionAt(text.length - suffix.length);
            const end = model.getFullModelRange().getEndPosition();
            decorations.set([{
                range: new monaco.Range(start.lineNumber, 1, end.lineNumber, end.column),
                options: {
                    isWholeLine: true,
                    className: 'cbg-locked-line',
                    glyphMarginClassName: 'cbg-locked-glyph',
                    glyphMarginHoverMessage: { value: 'Judge code: read-only' },
                    hoverMessage: { value: '**Read-only.** This code reads the test case and prints your answer.' },
                },
            }]);
        };
        refreshLockRef.current = refreshDecorations;

        let lastGoodText = model.getValue(LF);
        let lastGoodSelections = editor.getSelections();
        let reverting = false;

        editor.onDidChangeModelContent(() => {
            if (reverting) return;

            const text = model.getValue(LF);
            // A value pushed in from props (new language, new template) is never a user edit
            const isExternal = text === valueRef.current;

            if (isExternal || isIntact(text)) {
                lastGoodText = text;
                refreshDecorations();
                return;
            }

            // The edit touched the locked text: take it back
            reverting = true;
            queueMicrotask(() => {
                // Undo removes the edit cleanly, so Ctrl+Z never replays it
                editor.trigger('cbg-lock', 'undo', null);
                if (model.getValue(LF) !== lastGoodText) {
                    model.pushEditOperations([], [{ range: model.getFullModelRange(), text: lastGoodText }], () => null);
                }
                if (lastGoodSelections) editor.setSelections(lastGoodSelections);
                reverting = false;
                refreshDecorations();
            });
        });

        // Remember the caret from before a rejected edit so it can be put back
        editor.onDidChangeCursorSelection(() => {
            if (reverting) return;
            if (isIntact(model.getValue(LF))) lastGoodSelections = editor.getSelections();
        });

        refreshDecorations();
    };

    // The locked text can change without the content changing (e.g. switching challenge)
    useEffect(() => {
        refreshLockRef.current();
    }, [lockedSuffix]);

    // Focus the editor on load
    useEffect(() => {
        if (editorRef.current) {
            setTimeout(() => {
                editorRef.current?.focus();
            }, 100);
        }
    }, []);

    return (
        <Editor
            language={getMonacoLanguage(language)}
            value={value || ""}
            theme={editorTheme || (appTheme === "dark" ? "vs-dark" : "light")}
            onChange={(next) => {
                const text = next ?? "";
                const suffix = lockedSuffixRef.current;
                // Don't hand a rejected edit to the parent; the rollback follows immediately
                if (suffix && text !== valueRef.current && !text.endsWith(suffix)) return;
                onChange(text);
            }}
            onMount={handleEditorDidMount}
            options={{
                readOnly,
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
                glyphMargin: true,
            }}
        />
    );
};

export default CodeEditor;
