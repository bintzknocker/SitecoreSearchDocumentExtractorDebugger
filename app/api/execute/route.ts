import { NextRequest, NextResponse } from "next/server";
import * as vm from "node:vm";
import * as cheerio from "cheerio";

interface ExecuteRequestBody {
  rawInput: string;
  requestJson: string;
  extractorCode: string;
}

interface LogEntry {
  level: "log" | "warn" | "error";
  message: string;
}

function formatLogArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExecuteRequestBody;
  const { rawInput, requestJson, extractorCode } = body;

  const logs: LogEntry[] = [];
  const makeLogger = (level: LogEntry["level"]) =>
    (...args: unknown[]) => {
      logs.push({ level, message: args.map(formatLogArg).join(" ") });
    };

  // Autodetect the input type: if it parses as JSON, treat it as JSON; otherwise treat it as HTML.
  let responseBody: unknown;
  let isJson = true;
  try {
    responseBody = JSON.parse(rawInput);
  } catch {
    isJson = false;
    try {
      responseBody = cheerio.load(rawInput);
    } catch (err) {
      return NextResponse.json(
        { result: null, logs, error: `Failed to parse input as HTML: ${(err as Error).message}` },
        { status: 200 }
      );
    }
  }

  let requestObj: unknown;
  try {
    requestObj = requestJson.trim() ? JSON.parse(requestJson) : {};
  } catch (err) {
    return NextResponse.json(
      { result: null, logs, error: `Failed to parse request object as JSON: ${(err as Error).message}` },
      { status: 200 }
    );
  }

  const sandbox: Record<string, unknown> = {
    cheerio,
    $: isJson ? undefined : responseBody,
    console: {
      log: makeLogger("log"),
      warn: makeLogger("warn"),
      error: makeLogger("error"),
    },
    module: { exports: {} },
    exports: {},
  };

  const context = vm.createContext(sandbox);

  try {
    const script = new vm.Script(
      `${extractorCode}\n;(typeof extract === "function" ? extract : (module.exports && module.exports.extract))`
    );
    const extractFn = script.runInContext(context, { timeout: 5000 });

    if (typeof extractFn !== "function") {
      return NextResponse.json(
        { result: null, logs, error: 'No "extract" function was found in the provided code.' },
        { status: 200 }
      );
    }

    const result = extractFn(requestObj, { body: responseBody });
    return NextResponse.json({ result, logs, error: null });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { result: null, logs, error: error.stack || error.message },
      { status: 200 }
    );
  }
}
