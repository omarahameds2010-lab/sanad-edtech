import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoProvider } from './video-provider.interface';
import { BunnyStreamProvider } from './bunny-stream.provider';
import { VdoCipherProvider } from './vdocipher.provider';

@Injectable()
export class VideoProviderRegistry implements OnModuleInit {
  private providers = new Map<string, VideoProvider>();
  private defaultProvider: string;

  constructor(
    private configService: ConfigService,
    private bunnyStreamProvider: BunnyStreamProvider,
    private vdoCipherProvider: VdoCipherProvider,
  ) {}

  async onModuleInit() {
    this.defaultProvider = this.configService.get<string>('VIDEO_DEFAULT_PROVIDER') || 'bunny-stream';
    
    // Register all providers
    this.registerProvider(this.bunnyStreamProvider);
    this.registerProvider(this.vdoCipherProvider);
  }

  registerProvider(provider: VideoProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`[VideoProviderRegistry] Provider ${provider.name} already registered, overwriting`);
    }
    this.providers.set(provider.name, provider);
  }

  getProvider(name?: string): VideoProvider | undefined {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      console.warn(`[VideoProviderRegistry] Provider ${providerName} not found`);
      return undefined;
    }

    return provider;
  }

  getEnabledProviders(): VideoProvider[] {
    return Array.from(this.providers.values()).filter(p => {
      // Check if provider has required config
      return p.name === 'bunny-stream' || p.name === 'vdocipher';
    });
  }

  getDefaultProvider(): VideoProvider | undefined {
    return this.getProvider(this.defaultProvider);
  }

  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not registered`);
    }
    this.defaultProvider = name;
  }
}