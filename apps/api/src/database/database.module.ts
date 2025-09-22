import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db, Database } from './connection';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useValue: db,
      inject: [ConfigService],
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}