import { FindOptionsOrder, FindOptionsWhere } from 'typeorm';

//here would be base interface services for general support like findOne, findMany, findManyCustom, etc
export interface FindCustom<T> {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: string[];
  select?: (keyof T)[];
  order?: FindOptionsOrder<T>;
  skip?: number;
  take?: number;
}

export interface BaseService<T> {
  findOne(id: string, relations?: string[]): Promise<T | null>;
  findCustom(payload: FindCustom<T>): Promise<T[]>;
  findOneCustom?(payload: FindCustom<T>): Promise<T | null>;
}
