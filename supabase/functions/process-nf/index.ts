import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getDocument } from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ExtractedItem = {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type ExtractedNF = {
  supplier: string;
  total_value: number;
  items: ExtractedItem[];
};

type AiGatewayError = Error & {
  status?: number;
};

const AI_MODEL = "google/gemini-3-flash-preview";

function sanitizeStorageFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || `nf-${Date.now()}`;
}

function guessFileType(fileName?: string | null) {
  const lower = fileName?.toLowerCase() || "";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normalizeExtractedResult(input: any): ExtractedNF {
  const items = Array.isArray(input?.items)
    ? input.items
        .map((item: any) => ({
          name: String(item?.name || "Item não identificado").trim(),
          quantity: Number(item?.quantity || 0),
          unit_price: Number(item?.unit_price || 0),
          total_price: Number(item?.total_price || 0),
        }))
        .filter((item: ExtractedItem) => item.name)
        .map((item: ExtractedItem) => ({
          ...item,
          quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.round(item.quantity) : 1,
          unit_price: Number.isFinite(item.unit_price) ? item.unit_price : 0,
          total_price: Number.isFinite(item.total_price)
            ? item.total_price
            : (Number.isFinite(item.unit_price) ? item.unit_price : 0) * (Number.isFinite(item.quantity) && item.quantity > 0 ? Math.round(item.quantity) : 1),
        }))
    : [];

  return {
    supplier: String(input?.supplier || "Não identificado").trim() || "Não identificado",
    total_value: Number.isFinite(Number(input?.total_value)) ? Number(input.total_value) : 0,
    items,
  };
}

async function callLovableAi(messages: any[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "extract_nf_data",
            description: "Extrai fornecedor, valor total e itens de uma nota fiscal brasileira.",
            parameters: {
              type: "object",
              properties: {
                supplier: { type: "string" },
                total_value: { type: "number" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      quantity: { type: "number" },
                      unit_price: { type: "number" },
                      total_price: { type: "number" },
                    },
                    required: ["name", "quantity", "unit_price", "total_price"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["supplier", "total_value", "items"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_nf_data" } },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`AI Gateway error [${response.status}]: ${errorBody}`) as AiGatewayError;
    error.status = response.status;
    throw error;
  }

  const aiResult = await response.json();
  const toolArguments = aiResult?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

  if (!toolArguments) {
    throw new Error("A IA não retornou dados estruturados da NF.");
  }

  return normalizeExtractedResult(JSON.parse(toolArguments));
}

async function extractPdfText(pdfBytes: Uint8Array) {
  const loadingTask = getDocument({
    data: pdfBytes,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, 10);
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join("\n\n").slice(0, 40000);
}

async function extractFromPdf(pdfBytes: Uint8Array, fileName: string) {
  const pdfText = await extractPdfText(pdfBytes);

  if (!pdfText) {
    throw new Error(`Não foi possível extrair texto do PDF ${fileName}.`);
  }

  return callLovableAi([
    {
      role: "system",
      content:
        "Você extrai dados de notas fiscais brasileiras. Identifique fornecedor, valor total da nota e todos os itens listados com quantidade, valor unitário e valor total.",
    },
    {
      role: "user",
      content: `Arquivo: ${fileName}\n\nTexto extraído da nota fiscal:\n${pdfText}`,
    },
  ]);
}

async function extractFromImage(fileUrl: string) {
  return callLovableAi([
    {
      role: "system",
      content:
        "Você extrai dados de notas fiscais brasileiras. Identifique fornecedor, valor total da nota e todos os itens listados com quantidade, valor unitário e valor total.",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: fileUrl },
        },
        {
          type: "text",
          text: "Extraia o fornecedor, valor total e itens desta nota fiscal brasileira.",
        },
      ],
    },
  ]);
}

async function fetchFileBytes(fileUrl: string) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo enviado [${response.status}]`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Backend storage is not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const originalFileName = String(body?.fileName || "nota-fiscal");
    const fileType = String(body?.fileType || guessFileType(originalFileName));
    const providedFileUrl = body?.fileUrl ? String(body.fileUrl) : null;
    const unit = String(body?.unit || "BH-Matriz");
    const fileDataBase64 = body?.fileDataBase64 ? String(body.fileDataBase64) : null;

    let fileBytes = fileDataBase64 ? decodeBase64(fileDataBase64) : null;
    let fileUrl = providedFileUrl;

    if (!fileUrl && !fileBytes) {
      throw new Error("Nenhum arquivo foi enviado para processamento.");
    }

    if (!fileUrl && fileBytes) {
      const storagePath = `${crypto.randomUUID()}-${sanitizeStorageFileName(originalFileName)}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("nf-files")
        .upload(storagePath, fileBytes, {
          contentType: fileType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Falha ao salvar arquivo: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("nf-files").getPublicUrl(storagePath);
      fileUrl = publicUrlData.publicUrl;
    }

    const { data: nfRecord, error: insertError } = await supabaseAdmin
      .from("nf_uploads")
      .insert({
        file_name: originalFileName,
        file_url: fileUrl,
        status: "pendente",
      })
      .select()
      .single();

    if (insertError || !nfRecord) {
      throw new Error(insertError?.message || "Falha ao registrar a NF enviada.");
    }

    try {
      if (fileType === "application/pdf" && !fileBytes && fileUrl) {
        fileBytes = await fetchFileBytes(fileUrl);
      }

      const extracted = fileType === "application/pdf"
        ? await extractFromPdf(fileBytes as Uint8Array, originalFileName)
        : await extractFromImage(fileUrl as string);

      const { error: updateError } = await supabaseAdmin
        .from("nf_uploads")
        .update({
          supplier: extracted.supplier || null,
          total_value: extracted.total_value || null,
          status: "pendente",
        })
        .eq("id", nfRecord.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (extracted.items.length > 0) {
        const { error: itemsError } = await supabaseAdmin.from("nf_items").insert(
          extracted.items.map((item) => ({
            nf_upload_id: nfRecord.id,
            name: item.name,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total_price: item.total_price || 0,
          })),
        );

        if (itemsError) {
          throw new Error(itemsError.message);
        }
      }

      return new Response(
        JSON.stringify({
          id: nfRecord.id,
          file_url: fileUrl,
          status: "pendente",
          supplier: extracted.supplier,
          total_value: extracted.total_value,
          items: extracted.items,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : "Erro ao processar NF";
      const status = typeof (processingError as AiGatewayError)?.status === "number"
        ? (processingError as AiGatewayError).status!
        : 200;

      console.error("Error processing NF:", processingError);

      return new Response(
        JSON.stringify({
          id: nfRecord.id,
          file_url: fileUrl,
          status: "pendente",
          error: message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Error processing NF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno ao processar NF" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});