import { CloudWatchMetricsService } from './CloudWatchMetricsService';
import { SecretsManagerService } from './SecretsManagerService';
import { EventBridgePublisher } from '../events/EventBridgePublisher';

/**
 * Factory for creating AWS infrastructure service instances
 *
 * Provides centralized access to AWS services:
 * - CloudWatch Metrics
 * - Secrets Manager
 * - EventBridge Publisher
 *
 * Singleton pattern ensures consistent service instances across the application.
 */
export class AwsServiceFactory {
  private static _instance: AwsServiceFactory;

  private constructor() {}

  public static getInstance = (): AwsServiceFactory => {
    if (!this._instance) {
      this._instance = new AwsServiceFactory();
    }
    return this._instance;
  };

  /**
   * Create CloudWatch Metrics service for recording metrics
   */
  public metrics = (): CloudWatchMetricsService => new CloudWatchMetricsService();

  /**
   * Create Secrets Manager service for storing/retrieving secrets
   */
  public secretsManager = (): SecretsManagerService => new SecretsManagerService();

  /**
   * Create EventBridge Publisher for publishing events
   *
   * @param eventBusName - Name of the EventBridge event bus
   */
  public eventBridge = (eventBusName: string): EventBridgePublisher =>
    new EventBridgePublisher(eventBusName);
}
