// AUTO-GENERATED FILE.
import { FormControl } from '@angular/forms';

import { integerValidator } from '../validators/integer.validator';
import { uuidValidator } from '../validators/uuid.validator';

describe('generated validators', () => {
  it('should accept integers', () => {
    const control = new FormControl(10);
    expect(integerValidator()(control)).toBeNull();
  });

  it('should reject invalid uuids', () => {
    const control = new FormControl('not-a-uuid');
    expect(uuidValidator()(control)).toEqual({ uuid: true });
  });
});
