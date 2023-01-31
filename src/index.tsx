import * as esbuild from "esbuild-wasm";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useRef, useEffect, useState } from "react";
import { unpkgPathPlugin, fetchPlugin } from "./plugins/";

const App = () => {
  const ref = useRef<any>();
  const iframeRef = useRef<any>();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "/esbuild.wasm",
      //wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }
    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": "'production'",
        global: "window",
      },
    });

    //setCode(result.outputFiles[0].text);

    iframeRef.current.contentWindow.postMessage(
      result.outputFiles[0].text,
      "*"
    );
  };

  const html = `
   <html>
    <head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message',(e)=>{
            eval(e.data)
          })
        </script>
      </body>
    </head>
   </html>
`;

  return (
    <div>
      <textarea
        style={{ fontSize: "20px" }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <div>
        <button onClick={onClick}>Submit</button>
      </div>
      <pre>{code}</pre>
      <iframe
        style={{ border: "1px solid red" }}
        ref={iframeRef}
        sandbox="allow-scripts"
        srcDoc={html}
      ></iframe>
    </div>
  );
};

const root = createRoot(document.querySelector("#root") as any);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
