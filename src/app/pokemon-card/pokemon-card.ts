import { Component, input, output } from '@angular/core';
import { Pokemon } from '../interfaces/pokemon';

/** Tarjeta presentacional de un pokémon (solo muestra, sin lógica de datos). */
@Component({
  selector: 'app-pokemon-card',
  templateUrl: './pokemon-card.html',
  styleUrl: './pokemon-card.css',
  host: { '(click)': 'select.emit(pokemon())' },
})
export class PokemonCard {
  pokemon = input.required<Pokemon>();
  select = output<Pokemon>();

  displayName(name: string): string {
    return name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  pad(id: number): string {
    return String(id).padStart(4, '0');
  }

  sprite(pokemon: Pokemon): string {
    return (
      pokemon.sprites.other?.['official-artwork']?.front_default ??
      pokemon.sprites.front_default ??
      ''
    );
  }
}
