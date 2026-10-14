import { Component, HostListener, input, output } from '@angular/core';
import { Pokemon } from '../interfaces/pokemon';

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Especial',
  'special-defense': 'Def. Especial',
  speed: 'Velocidad',
};

/** Modal presentacional con el detalle completo de un pokémon. */
@Component({
  selector: 'app-pokemon-modal',
  templateUrl: './pokemon-modal.html',
  styleUrl: './pokemon-modal.css',
})
export class PokemonModal {
  pokemon = input.required<Pokemon>();
  close = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }

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

  statLabel(name: string): string {
    return STAT_LABELS[name] ?? this.displayName(name);
  }

  /** Ancho de la barra de stat (máximo de estadística: 255). */
  statPercent(baseStat: number): number {
    return Math.min(100, Math.round((baseStat / 255) * 100));
  }

  heightMeters(height: number): string {
    return (height / 10).toFixed(1);
  }

  weightKg(weight: number): string {
    return (weight / 10).toFixed(1);
  }
}
