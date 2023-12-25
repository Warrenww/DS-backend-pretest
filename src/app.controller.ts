import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { GetDataResultDTO } from './dtos/get-data-result.dto';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('data')
  @UseGuards(RateLimitGuard)
  async getData(
    @Query('user', ParseIntPipe) id: number,
  ): Promise<GetDataResultDTO> {
    return this.appService.getData(id);
  }
}
