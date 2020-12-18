import React from "react";

export interface EditorOnchangeEvent {
  getValue: (seperator?: string) => string;
}

export interface WhistleEditorProps {
  className?: string;
  mode?: "rules" | "html" | "js" | "pac" | "jsx" | "json" | "css" | "md";
  plugins?: { [name: string]: string };
  value?: string;
  onChange?: (e: EditorOnchangeEvent) => void;
  theme?:
    | "default"
    | "neat"
    | "elegant"
    | "erlang-dark"
    | "night"
    | "monokai"
    | "cobalt"
    | "eclipse"
    | "rubyblue"
    | "lesser-dark"
    | "xq-dark"
    | "xq-light"
    | "ambiance"
    | "blackboard"
    | "vibrant-ink"
    | "solarized dark"
    | "solarized light"
    | "twilight"
    | "midnight";
  fontSize?: string;
  lineNumbers?: boolean;
  onSave?: () => void;
}

declare const Editor: React.ComponentClass<WhistleEditorProps>;

export default Editor;
