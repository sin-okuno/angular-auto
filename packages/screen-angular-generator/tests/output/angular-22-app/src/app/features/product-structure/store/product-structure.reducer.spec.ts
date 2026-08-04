// AUTO-GENERATED FILE.
import { productStructureReducer } from './product-structure.reducer';
import { initialProductStructureState } from './product-structure.state';
import { ProductStructureActions } from './product-structure.actions';

describe('productStructureReducer', () => {
  it('should return the initial state for an unknown action', () => {
    const state = productStructureReducer(initialProductStructureState, { type: 'unknown' });
    expect(state).toEqual(initialProductStructureState);
  });

  it('should handle enterPage without throwing', () => {
    const state = productStructureReducer(
      initialProductStructureState,
      ProductStructureActions.enterPage(),
    );
    expect(state).toBeTruthy();
  });
});
