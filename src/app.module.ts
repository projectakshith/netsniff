import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { NetsniffModule } from './modules/netsniff/netsniff.module.js';
import { SystemHealthCheck } from './health/system.health.js';

@McpApp({
  module: AppModule,
  server: {
    name: 'netsniff-server',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
    ConfigModule.forRoot(),
    NetsniffModule
  ],
  providers: [
    SystemHealthCheck,
  ]
})
export class AppModule {}
