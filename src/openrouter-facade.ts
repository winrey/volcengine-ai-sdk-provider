import { loadApiKey, withoutTrailingSlash } from "@ai-sdk/provider-utils";
import { VolcEngineChatLanguageModel } from "./openrouter-chat-language-model";
import type {
  VolcEngineChatModelId,
  VolcEngineChatSettings,
} from "./openrouter-chat-settings";
import { OpenRouterCompletionLanguageModel } from "./openrouter-completion-language-model";
import type {
  OpenRouterCompletionModelId,
  OpenRouterCompletionSettings,
} from "./openrouter-completion-settings";
import type { VolcEngineProviderSettings } from "./openrouter-provider";

/**
@deprecated Use `createVolcEngine` instead.
 */
export class VolcEngine {
  /**
Use a different URL prefix for API calls, e.g. to use proxy servers.
The default prefix is `https://ark.cn-beijing.volces.com/api/v3`.
   */
  readonly baseURL: string;

  /**
API key that is being send using the `Authorization` header.
It defaults to the `VOLCENGINE_API_KEY` environment variable.
 */
  readonly apiKey?: string;

  /**
Custom headers to include in the requests.
   */
  readonly headers?: Record<string, string>;

  /**
   * Creates a new OpenRouter provider instance.
   */
  constructor(options: VolcEngineProviderSettings = {}) {
    this.baseURL =
      withoutTrailingSlash(options.baseURL ?? options.baseUrl) ??
      "https://ark.cn-beijing.volces.com/api/v3";
    this.apiKey = options.apiKey;
    this.headers = options.headers;
  }

  private get baseConfig() {
    return {
      baseURL: this.baseURL,
      headers: () => ({
        Authorization: `Bearer ${loadApiKey({
          apiKey: this.apiKey,
          environmentVariableName: "VOLCENGINE_API_KEY",
          description: "VolcEngine",
        })}`,
        ...this.headers,
      }),
    };
  }

  chat(modelId: VolcEngineChatModelId, settings: VolcEngineChatSettings = {}) {
    return new VolcEngineChatLanguageModel(modelId, settings, {
      provider: "openrouter.chat",
      ...this.baseConfig,
      compatibility: "strict",
      url: ({ path }) => `${this.baseURL}${path}`,
    });
  }

  completion(
    modelId: OpenRouterCompletionModelId,
    settings: OpenRouterCompletionSettings = {}
  ) {
    return new OpenRouterCompletionLanguageModel(modelId, settings, {
      provider: "openrouter.completion",
      ...this.baseConfig,
      compatibility: "strict",
      url: ({ path }) => `${this.baseURL}${path}`,
    });
  }
}
