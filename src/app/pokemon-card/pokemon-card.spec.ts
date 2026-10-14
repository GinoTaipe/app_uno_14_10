import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pokemon } from '../interfaces/pokemon';
import { PokemonCard } from './pokemon-card';

const PIKACHU: Pokemon = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  types: [
    { slot: 1, type: { name: 'electric', url: '' } },
  ],
  stats: [{ base_stat: 35, stat: { name: 'hp', url: '' } }],
  abilities: [{ ability: { name: 'static', url: '' }, is_hidden: false }],
  sprites: {
    front_default: 'https://example.com/pikachu.png',
    other: { 'official-artwork': { front_default: 'https://example.com/art.png' } },
  },
};

describe('PokemonCard', () => {
  let fixture: ComponentFixture<PokemonCard>;
  let component: PokemonCard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonCard],
    }).compileComponents();
    fixture = TestBed.createComponent(PokemonCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('pokemon', PIKACHU);
    fixture.detectChanges();
  });

  it('renderiza el nombre formateado y el tipo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toContain('Pikachu');
    expect(compiled.querySelector('.type')?.textContent).toContain('Electric');
  });

  it('usa el arte oficial cuando está disponible', () => {
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://example.com/art.png');
  });

  it('emite select al hacer clic', () => {
    let selected: Pokemon | undefined;
    component.select.subscribe((p) => (selected = p));
    (fixture.nativeElement as HTMLElement).click();
    expect(selected).toBe(PIKACHU);
  });
});
