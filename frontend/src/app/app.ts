import { Component, signal } from '@angular/core';
import { MineScene } from './mine-scene/mine-scene';

@Component({
  selector: 'app-root',
  imports: [MineScene],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
