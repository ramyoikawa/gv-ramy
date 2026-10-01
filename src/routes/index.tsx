import { createFileRoute } from "@tanstack/react-router";
import App from "../App";

const title = "gov.br — Documentos e serviços digitais";
const description =
  "Acesse sua carteira de documentos digitais, agenda, caixa postal e serviços gov.br em um só lugar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: App,
});
