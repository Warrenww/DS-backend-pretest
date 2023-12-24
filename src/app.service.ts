import { Injectable } from '@nestjs/common';
import { GetDataResultDTO } from './dtos/get-data-result.dto';

@Injectable()
export class AppService {
  getData(id: number): GetDataResultDTO {
    console.log(id);
    return {
      result: [],
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
