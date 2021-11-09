import React from 'react';

export interface EditorChangeEvent {
  getValue: () => string;
}

export interface HintOptions {
  protocol: string;
  value: string;
}

export interface HintCallback {
  (list: Array<string>): void
}

export interface GetHintList {
  (options: HintOptions, callback: HintCallback): void;
}

export type HintList = Array<string>;

export interface PluginConfig {
  homepage?: string;
  hintList?: HintList | GetHintList;
  pluginVars?: true | {
    hintList: HintList | GetHintList;
  }
}

export interface WhistleEditorProps {
  className?: string;
  mode?: "rules" | "html" | "js" | "pac" | "jsx" | "json" | "css" | "md";
  plugins?: {
    [name: string]: string | PluginConfig;
  };
  value?: string;
  onChange?: (e: EditorChangeEvent) => void;
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
}

declare class WhistleEditor extends React.Component<WhistleEditorProps> { }

export default WhistleEditor;
