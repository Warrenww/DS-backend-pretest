import { HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetDataResultDTO } from './dtos/get-data-result.dto';

@Injectable()
export class AppService {
  async getData(id: number): Promise<GetDataResultDTO> {
    const data = await axios
      .get<number[]>(
        'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty',
      )
      .then((res) => res.data)
      .catch((err) => {
        console.error(err);
        throw HttpException;
      });

    return {
      result: data.filter((x) => x % id === 0),
    };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
