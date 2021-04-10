// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = ".enso-wrapper {\n    background: black;\n    position:relative;\n    width: 100%;\n    height: 100%;\n}\n\n.enso-webgl\n{\n    position: relative;\n    width: 100%;\n    height: 100%;\n    outline: none;\n    opacity: 0;\n    transition: opacity 1.0s;\n}\n\n\n.enso-renderer-container {\n    /* position: relative; */\n    width: 100%;\n    height: 100%;\n}\n\n.enso-gui-container{\n    position: absolute;\n    top: 0px;\n    right: 25px;\n}\n\n.enso-mask{\n    position: absolute;\n    top: 0px;\n    height: 100%;\n    width: 100%;\n    background: black;\n    opacity: 0.50;\n    transition: opacity 1.5s;\n}\n\n\n\n.enso-container {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    position: absolute;\n    top: 0px;\n    box-sizing: border-box;\n    text-align: center;\n    height: 100%;\n    width: 100%;\n    padding: 50px;\n    color: white;\n    z-index: 1;\n    pointer-events: none;\n    line-height: 3em;\n}\n\n#enso-gameHero {\n    transition: opacity 1.5s;\n}\n\n.enso-container div {\n    width: 100%;\n}\n\n.enso-container h1 {\n    font-size: 5vw;\n    margin: 0px;\n    text-transform: uppercase;\n    width: 100%;\n}\n\n.enso-container p {\n    font-size: 0.8em;\n    width: 100%;\n}";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';
  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}