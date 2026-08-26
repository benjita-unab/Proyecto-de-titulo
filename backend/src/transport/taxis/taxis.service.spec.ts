import { Test, TestingModule } from '@nestjs/testing';
import { TaxisService } from './taxis.service';

describe('TaxisService', () => {
  let service: TaxisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxisService],
    }).compile();

    service = module.get<TaxisService>(TaxisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
