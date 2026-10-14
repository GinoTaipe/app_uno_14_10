import { Routes } from '@angular/router';
import { Pokedex } from './pokedex/pokedex';

export const routes: Routes = [
  { path: '', component: Pokedex },
  { path: '**', redirectTo: '' },
];
