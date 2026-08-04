// AUTO-GENERATED FILE.
import { selectProductStructureViewModel } from './product-structure.selectors';
import { initialProductStructureState } from './product-structure.state';

describe('ProductStructure selectors', () => {
  it('should project the view model', () => {
    const result = selectProductStructureViewModel.projector(initialProductStructureState);
    expect(result).toEqual(initialProductStructureState);
  });

  it('should expose store fields', () => {
    expect(initialProductStructureState).toBeTruthy();
  });
});
