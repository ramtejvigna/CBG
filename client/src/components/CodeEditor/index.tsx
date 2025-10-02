"use client";

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from "@monaco-editor/react";
import { useThemeStore } from "@/lib/store/themeStore";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    theme?: string;
    readOnly?: boolean;
    height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language,
    theme: editorTheme,
    readOnly = false,
}) => {
    const editorRef = useRef<any>(null);
        const { theme: appTheme } = useThemeStore();

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
    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
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
    };

    // Focus the editor on load
    useEffect(() => {
        if (editorRef.current) {
            setTimeout(() => {
                editorRef.current.focus();
            }, 100);
        }
    }, []);

    return (
        <Editor
            language={getMonacoLanguage(language)}
            value={value || ""}
            theme={editorTheme || (appTheme === "dark" ? "vs-dark" : "light")}
            onChange={(value) => onChange(value || "")}
            onMount={handleEditorDidMount}
            options={{
                readOnly,
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
            }}
        />
    );
};

export default CodeEditor;