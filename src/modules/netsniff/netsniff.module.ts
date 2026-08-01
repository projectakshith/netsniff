import { Module } from '@nitrostack/core';
import { NetsniffTools } from './netsniff.tools.js';

@Module({
  name: 'netsniff',
  description: 'api crawler and network traffic sniffer',
  controllers: [NetsniffTools]
})
export class NetsniffModule {}
