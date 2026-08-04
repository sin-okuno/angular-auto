import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'product-structure',
    loadChildren: () =>
      import('./features/product-structure/product-structure.module').then(
        (m) => m.ProductStructureModule,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'product-structure' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
