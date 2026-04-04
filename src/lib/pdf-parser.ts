export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid Turbopack ESM issues
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}
