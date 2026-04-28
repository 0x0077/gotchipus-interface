/** Scoped styles for ChatTab. Injected once via a <style> tag in the top-level
 *  ChatTab container — kept as a raw string rather than Tailwind utilities
 *  because most of these are Win98-specific pseudo-element tricks (cursors,
 *  scrollbars, `<details>` markers) and gradient-clipped shimmers. */
export const compactStyles = `
  /* Win98 scrollbar — narrower */
  .w98s::-webkit-scrollbar { width: 14px; }
  .w98s::-webkit-scrollbar-track { background: #c0c0c0; border-left: 1px solid #808080; }
  .w98s::-webkit-scrollbar-thumb {
    background: #c0c0c0;
    border: 2px outset #dfdfdf;
    border-right-color: #808080;
    border-bottom-color: #808080;
  }
  .w98s::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }
  .w98s::-webkit-scrollbar-button {
    display: block; height: 14px; background: #c0c0c0;
    border: 2px outset #dfdfdf;
    border-right-color: #808080; border-bottom-color: #808080;
  }

  @keyframes msgIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
  .msg-in { animation: msgIn .12s ease-out forwards; }

  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
  .sc::after { content:"▌"; color:#000080; animation:blink .7s step-end infinite; font-weight:bold; margin-left:1px; }
  .sc-l::after { content:"▌"; color:#90ff90; animation:blink .7s step-end infinite; font-weight:bold; margin-left:1px; }

  /* Single status strip — replaces three competing thinking UIs */
  @keyframes stripPulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
  .st-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; animation: stripPulse 1.2s ease-in-out infinite; }
  .st-dot-think { background:#000080; }
  .st-dot-tool  { background:#cc8800; }
  @keyframes stripShim { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
  .st-txt { background:linear-gradient(90deg,#606060 0%,#000080 50%,#606060 100%); background-size:200% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation:stripShim 2s linear infinite; font-weight:700; }

  /* Win98 recessed turn separator */
  .turn-divider { height:0; margin:10px -4px 8px; border-top:1px solid #808080; border-bottom:1px solid #ffffff; }

  /* User message row — YOU tag + hover Edit */
  .rx-user { display:flex; gap:8px; padding:2px 2px; align-items:flex-start; position:relative; }
  .rx-user-label { color:#808080; font-size:10px; font-weight:700; letter-spacing:.6px; flex-shrink:0; width:28px; padding-top:2px; }
  .rx-user-body { font-size:12px; color:#000; line-height:1.5; flex:1; word-break:break-word; }
  .rx-user-body.slash::before { content:"$ "; color:#008000; font-weight:700; font-family:"Courier New",monospace; }
  .rx-user-edit { opacity:0; transition:opacity .1s; border:1px solid transparent; background:transparent; color:#606060; font-size:10px; padding:0 5px; height:16px; cursor:pointer; flex-shrink:0; align-self:flex-start; margin-top:1px; font-family:inherit; }
  .rx-user:hover .rx-user-edit { opacity:1; }
  .rx-user-edit:hover { color:#000080; background:#d4d0c8; border-color:#808080; box-shadow:inset -1px -1px #808080, inset 1px 1px #fff; }
  .rx-user-edit:disabled { opacity:.4; cursor:not-allowed; }

  /* Inline user-message edit wrap */
  .rx-edit-wrap { flex:1; background:#fff; border:1px solid #000080; padding:4px 6px; box-shadow:inset 1px 1px #808080; }
  .rx-edit-wrap textarea { width:100%; border:none; outline:none; resize:none; background:transparent; font-family:inherit; font-size:12px; line-height:1.4; padding:0; min-height:32px; max-height:120px; }
  .rx-edit-row { display:flex; gap:4px; margin-top:4px; font-size:10px; align-items:center; }
  .rx-edit-hint { color:#606060; flex:1; }
  .rx-edit-row button { font:inherit; font-size:10px; padding:1px 8px; border:1px solid #808080; background:#c0c0c0; box-shadow:inset -1px -1px #808080, inset 1px 1px #fff; cursor:pointer; }
  .rx-edit-row button.pri { background:#000080; color:#fff; border-color:#000060; box-shadow:inset -1px -1px #000040, inset 1px 1px #4080ff; }
  .rx-edit-row button:disabled { opacity:.5; cursor:not-allowed; }

  /* AI response — white panel, left blue edge, serif body differentiates content from chrome */
  .rx-resp { background:#fff; border-left:2px solid #000080; padding:8px 10px 9px; width:100%; color:#202020; font-family:Georgia,"MS Serif",serif; font-size:12.5px; line-height:1.6; }
  .rx-resp .cmd code { background:#f0edd8; padding:0 3px; font-family:"Courier New",monospace; font-size:11px; }
  .rx-resp .cmd strong { color:#000080; }

  /* Thoughts — native <details>, left grey line, italic */
  .rx-thoughts { margin:4px 2px 2px; }
  .rx-thoughts summary { font-size:10px; color:#606060; cursor:pointer; user-select:none; padding:2px 0; list-style:none; }
  .rx-thoughts summary::-webkit-details-marker { display:none; }
  .rx-thoughts summary::before { content:"▸ "; color:#000080; font-weight:700; }
  .rx-thoughts[open] summary::before { content:"▾ "; }
  .rx-thoughts .body { padding:4px 10px; margin-top:2px; border-left:2px solid #a0a0a0; font-size:11px; line-height:1.6; color:#606060; font-style:italic; max-height:120px; overflow-y:auto; }

  /* Message actions — small square bevel buttons */
  .rx-actions { display:flex; gap:2px; padding:4px 0 0; }
  .rx-actions button { width:20px; height:20px; padding:0; border:1px solid transparent; background:transparent; color:#707070; font-family:"Courier New",monospace; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
  .rx-actions button:hover { color:#000080; border-color:#808080; background:#d4d0c8; box-shadow:inset -1px -1px #808080, inset 1px 1px #fff; }
  .rx-actions button:active { box-shadow:inset 1px 1px #808080, inset -1px -1px #fff; }
  .rx-actions .ok { color:#008000; }

  /* Send / Stop button */
  .rx-send { width:28px; height:26px; border:1px solid #000060; background:#000080; color:#fff; font-size:13px; font-weight:700; cursor:pointer; box-shadow:inset -1px -1px #000040, inset 1px 1px #4080ff; font-family:"Courier New",monospace; flex-shrink:0; }
  .rx-send:disabled { opacity:.5; cursor:not-allowed; background:#c0c0c0; color:#808080; box-shadow:inset -1px -1px #808080, inset 1px 1px #fff; border-color:#808080; }
  .rx-send.stop { background:#8b0000; border-color:#4a0000; box-shadow:inset -1px -1px #400000, inset 1px 1px #d04040; }

  /* Slash command autocomplete popover */
  .rx-slash { position:absolute; left:4px; right:36px; bottom:calc(100% - 1px); background:#fff; border:1px solid #000; box-shadow:2px 2px 0 rgba(0,0,0,0.25); max-height:180px; overflow-y:auto; z-index:10; }
  .rx-slash-hd { font-size:9px; color:#606060; background:#d4d0c8; padding:2px 6px; letter-spacing:.5px; border-bottom:1px solid #808080; display:flex; gap:6px; align-items:center; }
  .rx-slash-hd .tag { background:#000080; color:#fff; padding:0 4px; font-weight:700; }
  .rx-slash-item { padding:4px 8px; cursor:pointer; font-size:11px; display:flex; gap:6px; align-items:baseline; }
  .rx-slash-item.active { background:#000080; color:#fff; }
  .rx-slash-item.active .desc, .rx-slash-item.active .hint { color:#d0d8ff; }
  .rx-slash-item .cmd { font-family:"Courier New",monospace; font-weight:700; color:#000080; flex-shrink:0; }
  .rx-slash-item.active .cmd { color:#fff; }
  .rx-slash-item .desc { color:#303030; flex:1; }
  .rx-slash-item .hint { color:#808080; font-family:"Courier New",monospace; font-size:10px; }
  .rx-slash-item .badge { font-size:9px; font-weight:700; letter-spacing:.4px; padding:0 3px; flex-shrink:0; line-height:1.4; border:1px solid; }
  .rx-slash-item .badge.live { background:#006400; color:#fff; border-color:#003200; }
  .rx-slash-item .badge.prompt { background:#c0c0c0; color:#404040; border-color:#808080; }
  .rx-slash-item.active .badge.live { background:#90ff90; color:#003200; border-color:#90ff90; }
  .rx-slash-item.active .badge.prompt { background:#e0e0e0; color:#303030; border-color:#e0e0e0; }
  .rx-slash-foot { font-size:9px; color:#606060; background:#d4d0c8; padding:2px 6px; border-top:1px solid #808080; }

  /* Welcome card — avatar + name + intro + clickable slash hints */
  .rx-welcome { display:flex; gap:10px; padding:6px 2px 8px; align-items:flex-start; }
  .rx-welcome .name { font-size:13px; font-weight:700; color:#000080; }
  .rx-welcome .sub  { font-size:11px; line-height:1.5; color:#303030; margin-top:2px; }
  .rx-welcome .hints { margin-top:5px; font-size:10px; color:#606060; }
  .rx-welcome .hints code { background:#f0edd8; padding:0 4px; font-family:"Courier New",monospace; font-size:10px; cursor:pointer; color:#000080; margin-right:2px; }
  .rx-welcome .hints code:hover { background:#e0d8b0; }

  @keyframes p98 { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  .pd { animation: p98 2s ease-in-out infinite; }

  /* Compact markdown: kill extra spacing */
  .cmd p { margin:0 0 .2em; }
  .cmd p:last-child { margin-bottom:0; }
  .cmd ul,.cmd ol { margin:.15em 0; padding-left:1.2em; }
  .cmd li { margin:0; }
  .cmd pre { margin:.2em 0; padding:.25em .4em; font-size:12px; }
  .cmd code { padding:0 .15em; font-size:12px; }
  .cmd h1,.cmd h2,.cmd h3 { margin:.25em 0 .1em; font-size:13px; }
  .cmd blockquote { margin:.2em 0; padding-left:.6em; border-left:2px solid #808080; }
`;
