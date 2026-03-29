import type { GlobalProvider } from "@ladle/react";
import "@fontsource/press-start-2p";

export const Provider: GlobalProvider = ({ children }) => (
  <>
    <style>{`
      :root,
      body,
      #root,
      [data-ladle] {
        --bg-play-area: #1a1a2e;
        --bg-workstation: #0d0d1a;
        --primary-text: #00ff00;
        --secondary-text: #ffff00;
        --accent: #ff00ff;
        --workstation-border: #00ff00;
      }
      
      /* Reset Ladle's default padding/margins and ensure no overflow */
      [data-ladle] {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      
      /* Apply font globally */
      body {
        font-family: 'Press Start 2P', 'Courier New', monospace;
      }
    `}</style>
    {children}
  </>
);
