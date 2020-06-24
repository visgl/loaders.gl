import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import {Console} from "./console.service";

@Module({
  imports: [ConsoleModule],
  providers: [Console],
  exports: [Console]
})
export class AppModule {}
