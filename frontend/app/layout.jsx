import "./globals.css";

export const metadata = {
  title: "EcoPrompt — Prompt efficiency",
  description:
    "Optimize prompts for clarity and lower token cost before you ship to AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
