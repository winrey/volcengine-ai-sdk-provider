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

export interface VolcEngineProvider {
  (
    modelId: "openai/gpt-3.5-turbo-instruct",
    settings?: OpenRouterCompletionSettings
  ): OpenRouterCompletionLanguageModel;
  (
    modelId: VolcEngineChatModelId,
    settings?: VolcEngineChatSettings
  ): VolcEngineChatLanguageModel;

  languageModel(
    modelId: "openai/gpt-3.5-turbo-instruct",
    settings?: OpenRouterCompletionSettings
  ): OpenRouterCompletionLanguageModel;
  languageModel(
    modelId: VolcEngineChatModelId,
    settings?: VolcEngineChatSettings
  ): VolcEngineChatLanguageModel;

  /**
Creates an OpenRouter chat model for text generation.
   */
  chat(
    modelId: VolcEngineChatModelId,
    settings?: VolcEngineChatSettings
  ): VolcEngineChatLanguageModel;

  /**
Creates an OpenRouter completion model for text generation.
   */
  completion(
    modelId: OpenRouterCompletionModelId,
    settings?: OpenRouterCompletionSettings
  ): OpenRouterCompletionLanguageModel;
}

export interface VolcEngineProviderSettings {
  /**
Base URL for the OpenRouter API calls.
     */
  baseURL?: string;

  /**
@deprecated Use `baseURL` instead.
     */
  baseUrl?: string;

  /**
API key for authenticating requests.
     */
  apiKey?: string;

  /**
Custom headers to include in the requests.
     */
  headers?: Record<string, string>;

  /**
OpenRouter compatibility mode. Should be set to `strict` when using the OpenRouter API,
and `compatible` when using 3rd party providers. In `compatible` mode, newer
information such as streamOptions are not being sent. Defaults to 'compatible'.
   */
  compatibility?: "strict" | "compatible";

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: typeof fetch;

  /**
A JSON object to send as the request body to access OpenRouter features & upstream provider features.
  */
  extraBody?: Record<string, unknown>;
}

/**
Create an OpenRouter provider instance.
 */
export function createVolcEngine(
  options: VolcEngineProviderSettings = {}
): VolcEngineProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL ?? options.baseUrl) ??
    "https://ark.cn-beijing.volces.com/api/v3";

  // we default to compatible, because strict breaks providers like Groq:
  const compatibility = options.compatibility ?? "compatible";

  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: "VOLCENGINE_API_KEY",
      description: "VolcEngine",
    })}`,
    ...options.headers,
  });

  const createChatModel = (
    modelId: VolcEngineChatModelId,
    settings: VolcEngineChatSettings = {}
  ) =>
    new VolcEngineChatLanguageModel(modelId, settings, {
      provider: "openrouter.chat",
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      compatibility,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createCompletionModel = (
    modelId: OpenRouterCompletionModelId,
    settings: OpenRouterCompletionSettings = {}
  ) =>
    new OpenRouterCompletionLanguageModel(modelId, settings, {
      provider: "openrouter.completion",
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      compatibility,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createLanguageModel = (
    modelId: VolcEngineChatModelId | OpenRouterCompletionModelId,
    settings?: VolcEngineChatSettings | OpenRouterCompletionSettings
  ) => {
    if (new.target) {
      throw new Error(
        "The OpenRouter model function cannot be called with the new keyword."
      );
    }

    if (modelId === "openai/gpt-3.5-turbo-instruct") {
      return createCompletionModel(
        modelId,
        settings as OpenRouterCompletionSettings
      );
    }

    return createChatModel(modelId, settings as VolcEngineChatSettings);
  };

  const provider = function (
    modelId: VolcEngineChatModelId | OpenRouterCompletionModelId,
    settings?: VolcEngineChatSettings | OpenRouterCompletionSettings
  ) {
    return createLanguageModel(modelId, settings);
  };

  provider.languageModel = createLanguageModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;

  return provider as VolcEngineProvider;
}

/**
Default VolcEngine provider instance. It uses 'strict' compatibility mode.
 */
export const volcEngine = createVolcEngine({
  // compatibility: "strict", // strict for OpenRouter API
});
