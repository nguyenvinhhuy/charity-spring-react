import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import "./i18n"
import App from "./App.tsx"
import { bootstrapAccessToken } from "@/api/axios"

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrapAccessToken().then(render)
