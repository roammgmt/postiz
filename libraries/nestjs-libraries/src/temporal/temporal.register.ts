import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { TemporalService } from 'nestjs-temporal-core';
import { Connection } from '@temporalio/client';

@Injectable()
export class TemporalRegister implements OnModuleInit {
  constructor(private _client: TemporalService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.TEMPORAL_TLS === 'true') {
      return;
    }

    // ROAM: don't crash the whole backend when Temporal is unreachable.
    // Upstream lets this throw, which aborts Nest bootstrap ("Backend failed
    // to start on port 3000") and takes the API down — even though only
    // scheduling needs Temporal. Match the orchestrator's tolerance: warn and
    // continue so auth and the rest of the API come up. Scheduled posts stay
    // inert until a Temporal server is reachable at TEMPORAL_ADDRESS.
    try {
      const connection = this._client?.client?.getRawClient()
        ?.connection as Connection;

      const { customAttributes } =
        await connection.operatorService.listSearchAttributes({
          namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        });

      const neededAttribute = ['organizationId', 'postId'];
      const missingAttributes = neededAttribute.filter(
        (attr) => !customAttributes[attr]
      );

      if (missingAttributes.length > 0) {
        await connection.operatorService.addSearchAttributes({
          namespace: process.env.TEMPORAL_NAMESPACE || 'default',
          searchAttributes: missingAttributes.reduce((all, current) => {
            // @ts-ignore
            all[current] = 1;
            return all;
          }, {}),
        });
      }
    } catch (error) {
      console.warn(
        '[TemporalRegister] Temporal unreachable at ' +
          (process.env.TEMPORAL_ADDRESS || 'localhost:7233') +
          ' — skipping search-attribute registration; the API will start but ' +
          'scheduled posting stays disabled until Temporal is reachable.',
        error instanceof Error ? error.message : error
      );
    }
  }
}

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [TemporalRegister],
  get exports() {
    return this.providers;
  },
})
export class TemporalRegisterMissingSearchAttributesModule {}
