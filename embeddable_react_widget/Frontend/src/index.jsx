import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import baseCss from "./App.css"; // CSS string

function applyStyles(shadow) {
  // Constructable Stylesheets when supported (perf)
  if (
    "adoptedStyleSheets" in Document.prototype &&
    "replaceSync" in CSSStyleSheet.prototype
  ) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(baseCss);
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
  } else {
    const style = document.createElement("style");
    style.textContent = baseCss;
    shadow.appendChild(style);
  }
}

async function accountValidation(publicKey) {
  const response = await fetch(
    `https://somebackendsite.site/customer/validate/${publicKey}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.body) {
    throw new Error("No response body");
  }

  if (response.status === 401) {
    return false;
  } else if (response.status === 200) {
    return true;
  }
}

class MyReactWidgetElement extends HTMLElement {
  connectedCallback() {
    if (this._mounted) return;
    this._mounted = true;

    this.style.position = "fixed";
    this.style.bottom = "5px";
    this.style.right = "5px";
    this.style.zIndex = "2147483647";
    this.style.width = "auto";
    this.style.height = "auto";

    this._shadow = this.attachShadow({ mode: "open" });
    applyStyles(this._shadow);

    const mount = document.createElement("div");
    mount.id = "root";
    this._shadow.appendChild(mount);

    let props = {};
    const raw = this.getAttribute("props");
    if (raw) {
      try {
        props = JSON.parse(raw);
      } catch {}
    }

    const publicKey = props.publicKey;

    if (publicKey) {
      let validated;
      (async () => {
        validated = await accountValidation(publicKey);
        if (!validated) {
          console.log(
            `This account is not valid. Please contact Silver-Agent support.`,
          );
        } else if (validated) {
          this._root = createRoot(mount);
          this._root.render(
            <StrictMode>
              <App publicKey={publicKey} />
            </StrictMode>,
          );
        }
      })();
    }
  }
  disconnectedCallback() {
    try {
      this._root?.unmount();
    } catch {}
    this._mounted = false;
  }
}

(function register() {
  if (!customElements.get("my-react-widget")) {
    customElements.define("my-react-widget", MyReactWidgetElement);
  }
  window.MyWidget = window.MyWidget || {
    init({ props } = {}) {
      const el = document.createElement("my-react-widget");
      if (Object.keys(props).length)
        el.setAttribute("props", JSON.stringify(props));
      document.body.appendChild(el);
      return {
        destroy() {
          el.remove();
        },
      };
    },
  };
})();
