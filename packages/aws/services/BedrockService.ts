/**
 * AWS Bedrock Service
 *
 * Provides AI capabilities via AWS Bedrock (Claude models)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface BedrockModelConfig {
  modelId: string;
  temperature?: number;
  maxTokens?: number;
}

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  text: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Generic Bedrock service for invoking Claude models
 */
export class BedrockService {
  private client: BedrockRuntimeClient;
  private defaultConfig: BedrockModelConfig = {
    modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    temperature: 0.3,
    maxTokens: 4000,
  };

  constructor(region: string = 'us-east-1') {
    this.client = new BedrockRuntimeClient({ region });
  }

  /**
   * Invoke Claude model with messages
   */
  public invoke = async (
    messages: BedrockMessage[],
    config?: Partial<BedrockModelConfig>
  ): Promise<BedrockResponse> => {
    const modelConfig = { ...this.defaultConfig, ...config };

    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      messages,
    };

    const command = new InvokeModelCommand({
      modelId: modelConfig.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        text: responseBody.content[0].text,
        stopReason: responseBody.stop_reason,
        usage: {
          inputTokens: responseBody.usage.input_tokens,
          outputTokens: responseBody.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Bedrock invocation error:', error);
      throw error;
    }
  };

  /**
   * Invoke with a simple prompt (convenience method)
   */
  public invokeSimple = async (
    prompt: string,
    config?: Partial<BedrockModelConfig>
  ): Promise<string> => {
    const response = await this.invoke(
      [{ role: 'user', content: prompt }],
      config
    );
    return response.text;
  };
}
