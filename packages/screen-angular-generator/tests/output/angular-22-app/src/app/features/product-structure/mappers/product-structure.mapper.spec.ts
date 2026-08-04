// AUTO-GENERATED FILE.
import * as mappers from './product-structure.mapper';

describe('ProductStructure mappers', () => {
  it('should export mapper functions', () => {
    expect(Object.keys(mappers).length).toBeGreaterThan(0);
  });

  it('should map http errors', () => {
    const result = mappers.mapHttpError(new Error('boom'));
    expect(result.message).toContain('boom');
  });
});
