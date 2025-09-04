// GitHub-compatible CSS styles for markdown preview

export interface GitHubStyleOptions {
  theme: "light" | "dark" | "auto";
  fontSize: string;
  fontFamily: string;
  maxWidth?: string;
}

export function getGitHubCSS(
  options: GitHubStyleOptions = {
    theme: "light",
    fontSize: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  },
): string {
  const { theme, fontSize, fontFamily, maxWidth } = options;

  const lightColors = {
    fg: "#1f2328",
    fgMuted: "#656d76",
    fgSubtle: "#6e7781",
    canvas: "#ffffff",
    canvasSubtle: "#f6f8fa",
    border: "#d1d9e0",
    borderMuted: "#d8dee4",
    neutral: "#afb8c1",
    accent: "#0969da",
    success: "#1a7f37",
    attention: "#9a6700",
    severe: "#bc4c00",
    danger: "#d1242f",
    done: "#8250df",
  };

  const darkColors = {
    fg: "#f0f6fc",
    fgMuted: "#8b949e",
    fgSubtle: "#6e7681",
    canvas: "#0d1117",
    canvasSubtle: "#161b22",
    border: "#30363d",
    borderMuted: "#21262d",
    neutral: "#6e7681",
    accent: "#58a6ff",
    success: "#3fb950",
    attention: "#d29922",
    severe: "#db6d28",
    danger: "#f85149",
    done: "#a5a5ff",
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return `
    .github-markdown-body {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      color: ${colors.fg};
      background-color: ${colors.canvas};
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: 1.5;
      word-wrap: break-word;
      ${maxWidth ? `max-width: ${maxWidth};` : ""}
    }

    .github-markdown-body .octicon {
      display: inline-block;
      vertical-align: text-top;
      fill: currentColor;
    }

    .github-markdown-body h1:hover .anchor .octicon-link:before,
    .github-markdown-body h2:hover .anchor .octicon-link:before,
    .github-markdown-body h3:hover .anchor .octicon-link:before,
    .github-markdown-body h4:hover .anchor .octicon-link:before,
    .github-markdown-body h5:hover .anchor .octicon-link:before,
    .github-markdown-body h6:hover .anchor .octicon-link:before {
      width: 16px;
      height: 16px;
      content: ' ';
      display: inline-block;
      background-color: currentColor;
      -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z'></path></svg>");
      mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z'></path></svg>");
    }

    .github-markdown-body details,
    .github-markdown-body figcaption,
    .github-markdown-body figure {
      display: block;
    }

    .github-markdown-body summary {
      display: list-item;
    }

    .github-markdown-body [hidden] {
      display: none !important;
    }

    .github-markdown-body a {
      background-color: transparent;
      color: ${colors.accent};
      text-decoration: none;
    }

    .github-markdown-body a:active,
    .github-markdown-body a:hover {
      outline-width: 0;
    }

    .github-markdown-body abbr[title] {
      border-bottom: none;
      text-decoration: underline dotted;
    }

    .github-markdown-body b,
    .github-markdown-body strong {
      font-weight: 600;
    }

    .github-markdown-body dfn {
      font-style: italic;
    }

    .github-markdown-body h1 {
      margin: .67em 0;
      font-weight: 600;
      padding-bottom: .3em;
      font-size: 2em;
      border-bottom: 1px solid ${colors.borderMuted};
    }

    .github-markdown-body mark {
      background-color: ${colors.attention};
      color: ${colors.fg};
    }

    .github-markdown-body small {
      font-size: 90%;
    }

    .github-markdown-body sub,
    .github-markdown-body sup {
      font-size: 75%;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }

    .github-markdown-body sub {
      bottom: -0.25em;
    }

    .github-markdown-body sup {
      top: -0.5em;
    }

    .github-markdown-body img {
      border-style: none;
      max-width: 100%;
      box-sizing: content-box;
      background-color: ${colors.canvas};
    }

    .github-markdown-body code,
    .github-markdown-body kbd,
    .github-markdown-body pre,
    .github-markdown-body samp {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 1em;
    }

    .github-markdown-body figure {
      margin: 1em 40px;
    }

    .github-markdown-body hr {
      box-sizing: content-box;
      overflow: hidden;
      background: transparent;
      border-bottom: 1px solid ${colors.borderMuted};
      height: .25em;
      padding: 0;
      margin: 24px 0;
      background-color: ${colors.borderMuted};
      border: 0;
    }

    .github-markdown-body input {
      font: inherit;
      margin: 0;
      overflow: visible;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    .github-markdown-body [type=button],
    .github-markdown-body [type=reset],
    .github-markdown-body [type=submit] {
      -webkit-appearance: button;
    }

    .github-markdown-body [type=checkbox],
    .github-markdown-body [type=radio] {
      box-sizing: border-box;
      padding: 0;
    }

    .github-markdown-body [type=number]::-webkit-inner-spin-button,
    .github-markdown-body [type=number]::-webkit-outer-spin-button {
      height: auto;
    }

    .github-markdown-body [type=search]::-webkit-search-cancel-button,
    .github-markdown-body [type=search]::-webkit-search-decoration {
      -webkit-appearance: none;
    }

    .github-markdown-body ::-webkit-input-placeholder {
      color: inherit;
      opacity: .54;
    }

    .github-markdown-body ::-webkit-file-upload-button {
      -webkit-appearance: button;
      font: inherit;
    }

    .github-markdown-body a:hover {
      text-decoration: underline;
    }

    .github-markdown-body ::placeholder {
      color: ${colors.fgSubtle};
      opacity: 1;
    }

    .github-markdown-body hr::before {
      display: table;
      content: "";
    }

    .github-markdown-body hr::after {
      display: table;
      clear: both;
      content: "";
    }

    .github-markdown-body table {
      border-spacing: 0;
      border-collapse: collapse;
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
    }

    .github-markdown-body td,
    .github-markdown-body th {
      padding: 0;
    }

    .github-markdown-body details summary {
      cursor: pointer;
    }

    .github-markdown-body details:not([open])>*:not(summary) {
      display: none !important;
    }

    .github-markdown-body a:focus,
    .github-markdown-body [role=button]:focus,
    .github-markdown-body input[type=radio]:focus,
    .github-markdown-body input[type=checkbox]:focus {
      outline: 2px solid ${colors.accent};
      outline-offset: -2px;
      box-shadow: none;
    }

    .github-markdown-body a:focus:not(:focus-visible),
    .github-markdown-body [role=button]:focus:not(:focus-visible),
    .github-markdown-body input[type=radio]:focus:not(:focus-visible),
    .github-markdown-body input[type=checkbox]:focus:not(:focus-visible) {
      outline: solid 1px transparent;
    }

    .github-markdown-body a:focus-visible,
    .github-markdown-body [role=button]:focus-visible,
    .github-markdown-body input[type=radio]:focus-visible,
    .github-markdown-body input[type=checkbox]:focus-visible {
      outline: 2px solid ${colors.accent};
      outline-offset: -2px;
      box-shadow: none;
    }

    .github-markdown-body a:not([class]):focus,
    .github-markdown-body a:not([class]):focus-visible,
    .github-markdown-body input[type=radio]:focus,
    .github-markdown-body input[type=radio]:focus-visible,
    .github-markdown-body input[type=checkbox]:focus,
    .github-markdown-body input[type=checkbox]:focus-visible {
      outline-offset: 0;
    }

    .github-markdown-body kbd {
      display: inline-block;
      padding: 3px 5px;
      font: 11px ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      line-height: 10px;
      color: ${colors.fg};
      vertical-align: middle;
      background-color: ${colors.canvasSubtle};
      border: solid 1px ${colors.neutral};
      border-bottom-color: ${colors.neutral};
      border-radius: 6px;
      box-shadow: inset 0 -1px 0 ${colors.neutral};
    }

    .github-markdown-body h1,
    .github-markdown-body h2,
    .github-markdown-body h3,
    .github-markdown-body h4,
    .github-markdown-body h5,
    .github-markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }

    .github-markdown-body h2 {
      font-weight: 600;
      padding-bottom: .3em;
      font-size: 1.5em;
      border-bottom: 1px solid ${colors.borderMuted};
    }

    .github-markdown-body h3 {
      font-weight: 600;
      font-size: 1.25em;
    }

    .github-markdown-body h4 {
      font-weight: 600;
      font-size: 1em;
    }

    .github-markdown-body h5 {
      font-weight: 600;
      font-size: .875em;
    }

    .github-markdown-body h6 {
      font-weight: 600;
      font-size: .85em;
      color: ${colors.fgMuted};
    }

    .github-markdown-body p {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .github-markdown-body blockquote {
      margin: 0;
      padding: 0 1em;
      color: ${colors.fgMuted};
      border-left: .25em solid ${colors.borderMuted};
    }

    .github-markdown-body ul,
    .github-markdown-body ol {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 2em;
    }

    .github-markdown-body ol ol,
    .github-markdown-body ul ol {
      list-style-type: lower-roman;
    }

    .github-markdown-body ul ul ol,
    .github-markdown-body ul ol ol,
    .github-markdown-body ol ul ol,
    .github-markdown-body ol ol ol {
      list-style-type: lower-alpha;
    }

    .github-markdown-body dd {
      margin-left: 0;
    }

    .github-markdown-body tt,
    .github-markdown-body code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 12px;
    }

    .github-markdown-body pre {
      margin-top: 0;
      margin-bottom: 16px;
      font: 12px ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      word-wrap: normal;
    }

    .github-markdown-body .octicon {
      display: inline-block;
      overflow: visible !important;
      vertical-align: text-bottom;
      fill: currentColor;
    }

    .github-markdown-body ::placeholder {
      color: ${colors.fgSubtle};
      opacity: 1;
    }

    .github-markdown-body input::-webkit-outer-spin-button,
    .github-markdown-body input::-webkit-inner-spin-button {
      margin: 0;
      -webkit-appearance: none;
      appearance: none;
    }

    .github-markdown-body .pl-c {
      color: ${colors.fgMuted};
    }

    .github-markdown-body .pl-c1,
    .github-markdown-body .pl-s .pl-v {
      color: ${colors.accent};
    }

    .github-markdown-body .pl-e,
    .github-markdown-body .pl-en {
      color: ${colors.done};
    }

    .github-markdown-body .pl-smi,
    .github-markdown-body .pl-s .pl-s1 {
      color: ${colors.fg};
    }

    .github-markdown-body .pl-ent {
      color: ${colors.success};
    }

    .github-markdown-body .pl-k {
      color: ${colors.danger};
    }

    .github-markdown-body .pl-s,
    .github-markdown-body .pl-pds,
    .github-markdown-body .pl-s .pl-pse .pl-s1,
    .github-markdown-body .pl-sr,
    .github-markdown-body .pl-sr .pl-cce,
    .github-markdown-body .pl-sr .pl-sre,
    .github-markdown-body .pl-sr .pl-sra {
      color: ${colors.accent};
    }

    .github-markdown-body .pl-v,
    .github-markdown-body .pl-smw {
      color: ${colors.danger};
    }

    .github-markdown-body .pl-bu {
      color: ${colors.severe};
    }

    .github-markdown-body .pl-ii {
      color: ${colors.canvas};
      background-color: ${colors.danger};
    }

    .github-markdown-body .pl-c2 {
      color: ${colors.canvas};
      background-color: ${colors.danger};
    }

    .github-markdown-body .pl-sr .pl-cce {
      font-weight: bold;
      color: ${colors.success};
    }

    .github-markdown-body .pl-ml {
      color: ${colors.attention};
    }

    .github-markdown-body .pl-mh,
    .github-markdown-body .pl-mh .pl-en,
    .github-markdown-body .pl-ms {
      font-weight: bold;
      color: ${colors.accent};
    }

    .github-markdown-body .pl-mi {
      font-style: italic;
      color: ${colors.fg};
    }

    .github-markdown-body .pl-mb {
      font-weight: bold;
      color: ${colors.fg};
    }

    .github-markdown-body .pl-md {
      color: ${colors.danger};
      background-color: ${theme === "dark" ? "#67060c" : "#ffeef0"};
    }

    .github-markdown-body .pl-mi1 {
      color: ${colors.success};
      background-color: ${theme === "dark" ? "#0f5132" : "#f0fff4"};
    }

    .github-markdown-body .pl-mc {
      color: ${colors.attention};
      background-color: ${theme === "dark" ? "#9a6700" : "#fff8c5"};
    }

    .github-markdown-body .pl-mi2 {
      color: ${colors.fg};
      background-color: ${theme === "dark" ? "#1158c7" : "#eef9ff"};
    }

    .github-markdown-body .pl-mdr {
      font-weight: bold;
      color: ${colors.done};
    }

    .github-markdown-body .pl-ba {
      color: ${colors.fgMuted};
    }

    .github-markdown-body .pl-sg {
      color: ${colors.fgSubtle};
    }

    .github-markdown-body .pl-corl {
      text-decoration: underline;
      color: ${colors.accent};
    }

    .github-markdown-body [data-catalyst] {
      display: block;
    }

    .github-markdown-body g-emoji {
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
      font-size: 1em;
      font-style: normal !important;
      font-weight: 400 !important;
      line-height: 1;
      vertical-align: -0.075em;
    }

    .github-markdown-body g-emoji img {
      width: 1em;
      height: 1em;
    }

    .github-markdown-body::before {
      display: table;
      content: "";
    }

    .github-markdown-body::after {
      display: table;
      clear: both;
      content: "";
    }

    .github-markdown-body>*:first-child {
      margin-top: 0 !important;
    }

    .github-markdown-body>*:last-child {
      margin-bottom: 0 !important;
    }

    .github-markdown-body a:not([href]) {
      color: inherit;
      text-decoration: none;
    }

    .github-markdown-body .absent {
      color: ${colors.danger};
    }

    .github-markdown-body .anchor {
      float: left;
      padding-right: 4px;
      margin-left: -20px;
      line-height: 1;
    }

    .github-markdown-body .anchor:focus {
      outline: none;
    }

    .github-markdown-body p,
    .github-markdown-body blockquote,
    .github-markdown-body ul,
    .github-markdown-body ol,
    .github-markdown-body dl,
    .github-markdown-body table,
    .github-markdown-body pre,
    .github-markdown-body details {
      margin-top: 0;
      margin-bottom: 16px;
    }

    .github-markdown-body blockquote>:first-child {
      margin-top: 0;
    }

    .github-markdown-body blockquote>:last-child {
      margin-bottom: 0;
    }

    .github-markdown-body h1 .octicon-link,
    .github-markdown-body h2 .octicon-link,
    .github-markdown-body h3 .octicon-link,
    .github-markdown-body h4 .octicon-link,
    .github-markdown-body h5 .octicon-link,
    .github-markdown-body h6 .octicon-link {
      color: ${colors.fg};
      vertical-align: middle;
      visibility: hidden;
    }

    .github-markdown-body h1:hover .anchor,
    .github-markdown-body h2:hover .anchor,
    .github-markdown-body h3:hover .anchor,
    .github-markdown-body h4:hover .anchor,
    .github-markdown-body h5:hover .anchor,
    .github-markdown-body h6:hover .anchor {
      text-decoration: none;
    }

    .github-markdown-body h1:hover .anchor .octicon-link,
    .github-markdown-body h2:hover .anchor .octicon-link,
    .github-markdown-body h3:hover .anchor .octicon-link,
    .github-markdown-body h4:hover .anchor .octicon-link,
    .github-markdown-body h5:hover .anchor .octicon-link,
    .github-markdown-body h6:hover .anchor .octicon-link {
      visibility: visible;
    }

    .github-markdown-body h1 tt,
    .github-markdown-body h1 code,
    .github-markdown-body h2 tt,
    .github-markdown-body h2 code,
    .github-markdown-body h3 tt,
    .github-markdown-body h3 code,
    .github-markdown-body h4 tt,
    .github-markdown-body h4 code,
    .github-markdown-body h5 tt,
    .github-markdown-body h5 code,
    .github-markdown-body h6 tt,
    .github-markdown-body h6 code {
      padding: 0 .2em;
      font-size: inherit;
    }

    .github-markdown-body summary h1,
    .github-markdown-body summary h2,
    .github-markdown-body summary h3,
    .github-markdown-body summary h4,
    .github-markdown-body summary h5,
    .github-markdown-body summary h6 {
      display: inline-block;
    }

    .github-markdown-body summary h1 .anchor,
    .github-markdown-body summary h2 .anchor,
    .github-markdown-body summary h3 .anchor,
    .github-markdown-body summary h4 .anchor,
    .github-markdown-body summary h5 .anchor,
    .github-markdown-body summary h6 .anchor {
      margin-left: -40px;
    }

    .github-markdown-body summary h1,
    .github-markdown-body summary h2 {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .github-markdown-body ul.no-list,
    .github-markdown-body ol.no-list {
      padding: 0;
      list-style-type: none;
    }

    .github-markdown-body ol[type="a s"] {
      list-style-type: lower-alpha;
    }

    .github-markdown-body ol[type="A s"] {
      list-style-type: upper-alpha;
    }

    .github-markdown-body ol[type="i s"] {
      list-style-type: lower-roman;
    }

    .github-markdown-body ol[type="I s"] {
      list-style-type: upper-roman;
    }

    .github-markdown-body ol[type="1"] {
      list-style-type: decimal;
    }

    .github-markdown-body div>ol:not([type]) {
      list-style-type: decimal;
    }

    .github-markdown-body ul ul,
    .github-markdown-body ul ol,
    .github-markdown-body ol ol,
    .github-markdown-body ol ul {
      margin-top: 0;
      margin-bottom: 0;
    }

    .github-markdown-body li>p {
      margin-top: 16px;
    }

    .github-markdown-body li+li {
      margin-top: .25em;
    }

    .github-markdown-body dl {
      padding: 0;
    }

    .github-markdown-body dl dt {
      padding: 0;
      margin-top: 16px;
      font-size: 1em;
      font-style: italic;
      font-weight: 600;
    }

    .github-markdown-body dl dd {
      padding: 0 16px;
      margin-bottom: 16px;
    }

    .github-markdown-body table th {
      font-weight: 600;
    }

    .github-markdown-body table th,
    .github-markdown-body table td {
      padding: 6px 13px;
      border: 1px solid ${colors.border};
    }

    .github-markdown-body table tr {
      background-color: ${colors.canvas};
      border-top: 1px solid ${colors.borderMuted};
    }

    .github-markdown-body table tr:nth-child(2n) {
      background-color: ${colors.canvasSubtle};
    }

    .github-markdown-body table img {
      background-color: transparent;
    }

    .github-markdown-body img[align=right] {
      padding-left: 20px;
    }

    .github-markdown-body img[align=left] {
      padding-right: 20px;
    }

    .github-markdown-body .emoji {
      max-width: none;
      vertical-align: text-top;
      background-color: transparent;
    }

    .github-markdown-body span.frame {
      display: block;
      overflow: hidden;
    }

    .github-markdown-body span.frame>span {
      display: block;
      float: left;
      width: auto;
      padding: 7px;
      margin: 13px 0 0;
      overflow: hidden;
      border: 1px solid ${colors.border};
    }

    .github-markdown-body span.frame span img {
      display: block;
      float: left;
    }

    .github-markdown-body span.frame span span {
      display: block;
      padding: 5px 0 0;
      clear: both;
      color: ${colors.fg};
    }

    .github-markdown-body span.align-center {
      display: block;
      overflow: hidden;
      clear: both;
    }

    .github-markdown-body span.align-center>span {
      display: block;
      margin: 13px auto 0;
      overflow: hidden;
      text-align: center;
    }

    .github-markdown-body span.align-center span img {
      margin: 0 auto;
      text-align: center;
    }

    .github-markdown-body span.align-right {
      display: block;
      overflow: hidden;
      clear: both;
    }

    .github-markdown-body span.align-right>span {
      display: block;
      margin: 13px 0 0;
      overflow: hidden;
      text-align: right;
    }

    .github-markdown-body span.align-right span img {
      margin: 0;
      text-align: right;
    }

    .github-markdown-body span.float-left {
      display: block;
      margin-right: 13px;
      overflow: hidden;
      float: left;
    }

    .github-markdown-body span.float-left span {
      margin: 13px 0 0;
    }

    .github-markdown-body span.float-right {
      display: block;
      margin-left: 13px;
      overflow: hidden;
      float: right;
    }

    .github-markdown-body span.float-right>span {
      display: block;
      margin: 13px auto 0;
      overflow: hidden;
      text-align: right;
    }

    .github-markdown-body code,
    .github-markdown-body tt {
      padding: .2em .4em;
      margin: 0;
      font-size: 85%;
      white-space: break-spaces;
      background-color: ${colors.neutral};
      border-radius: 6px;
    }

    .github-markdown-body code br,
    .github-markdown-body tt br {
      display: none;
    }

    .github-markdown-body del code {
      text-decoration: inherit;
    }

    .github-markdown-body samp {
      font-size: 85%;
    }

    .github-markdown-body pre code {
      font-size: 100%;
    }

    .github-markdown-body pre>code {
      padding: 0;
      margin: 0;
      word-break: normal;
      white-space: pre;
      background: transparent;
      border: 0;
    }

    .github-markdown-body .highlight {
      margin-bottom: 16px;
    }

    .github-markdown-body .highlight pre {
      margin-bottom: 0;
      word-break: normal;
    }

    .github-markdown-body .highlight pre,
    .github-markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: ${colors.canvasSubtle};
      border-radius: 6px;
    }

    .github-markdown-body pre code,
    .github-markdown-body pre tt {
      display: inline;
      max-width: auto;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }

    .github-markdown-body .csv-data td,
    .github-markdown-body .csv-data th {
      padding: 5px;
      overflow: hidden;
      font-size: 12px;
      line-height: 1;
      text-align: left;
      white-space: nowrap;
    }

    .github-markdown-body .csv-data .blob-num {
      padding: 10px 8px 9px;
      text-align: right;
      background: ${colors.canvasSubtle};
      border: 0;
    }

    .github-markdown-body .csv-data tr {
      border-top: 0;
    }

    .github-markdown-body .csv-data th {
      font-weight: 600;
      background: ${colors.canvasSubtle};
      border-top: 0;
    }

    /* Task list items */
    .github-markdown-body .task-list-item {
      list-style-type: none;
    }

    .github-markdown-body .task-list-item+.task-list-item {
      margin-top: 4px;
    }

    .github-markdown-body .task-list-item-checkbox {
      margin: 0 .2em .25em -1.4em;
      vertical-align: middle;
    }

    .github-markdown-body .contains-task-list:dir(rtl) .task-list-item-checkbox {
      margin: 0 -1.6em .25em .2em;
    }

    /* Code blocks */
    .github-markdown-body .code-block-wrapper {
      margin-bottom: 16px;
    }

    .github-markdown-body .code-block {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: ${colors.canvasSubtle};
      border-radius: 6px;
    }

    /* Tables */
    .github-markdown-body .table-wrapper {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    .github-markdown-body .gfm-table {
      border-spacing: 0;
      border-collapse: collapse;
      display: block;
      width: max-content;
      max-width: 100%;
      overflow: auto;
    }

    .github-markdown-body .footnotes {
      font-size: 12px;
      color: ${colors.fgMuted};
      border-top: 1px solid ${colors.border};
    }

    .github-markdown-body .footnotes ol {
      padding-left: 16px;
    }

    .github-markdown-body .footnotes li {
      position: relative;
    }

    .github-markdown-body .footnotes li:target::before {
      position: absolute;
      top: -8px;
      right: -8px;
      bottom: -8px;
      left: -24px;
      pointer-events: none;
      content: "";
      border: 2px solid ${colors.accent};
      border-radius: 6px;
    }

    .github-markdown-body .footnotes li:target {
      color: ${colors.fg};
    }

    .github-markdown-body .footnotes .data-footnote-backref g-emoji {
      font-family: monospace;
    }

    .github-markdown-body .pl-0 {
      padding-left: 0 !important;
    }

    .github-markdown-body .pl-1 {
      padding-left: 4px !important;
    }

    .github-markdown-body .pl-2 {
      padding-left: 8px !important;
    }

    .github-markdown-body .pl-3 {
      padding-left: 16px !important;
    }

    .github-markdown-body .pl-4 {
      padding-left: 24px !important;
    }

    .github-markdown-body .pl-5 {
      padding-left: 32px !important;
    }

    .github-markdown-body .pl-6 {
      padding-left: 40px !important;
    }

    .github-markdown-body .pl-7 {
      padding-left: 48px !important;
    }

    .github-markdown-body .pl-8 {
      padding-left: 64px !important;
    }

    .github-markdown-body .pl-9 {
      padding-left: 80px !important;
    }

    .github-markdown-body .pl-10 {
      padding-left: 96px !important;
    }

    .github-markdown-body .pl-11 {
      padding-left: 112px !important;
    }

    .github-markdown-body .pl-12 {
      padding-left: 128px !important;
    }

    @media (prefers-color-scheme: dark) {
      .github-markdown-body[data-theme="auto"] {
        color: ${darkColors.fg};
        background-color: ${darkColors.canvas};
      }
    }
  `;
}
