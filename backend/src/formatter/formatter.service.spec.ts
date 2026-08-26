import { Test, TestingModule } from '@nestjs/testing';
import { FormatterService } from './formatter.service';

describe('FormatterService', () => {
  let service: FormatterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormatterService],
    }).compile();

    service = module.get<FormatterService>(FormatterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
