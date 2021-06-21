import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { VisualizerComponent } from './components/visualizer/visualizer.component';
import { PlayerComponent } from './components/player/player.component';
import { HeaderComponent } from './components/header/header.component';
import { ControlsComponent } from './components/controls/controls.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HttpClientModule } from '@angular/common/http';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './shared/interceptors/token.interceptor';
import { RouterModule } from '@angular/router';
import { PlaylistBarComponent } from './components/playlist-bar/playlist-bar.component';
import { StationBarComponent } from './components/station-bar/station-bar.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { RadioPageComponent } from './components/radio-page/radio-page.component';
import { AppRoutingModule } from './app-routing.module';
import { DomWatcherDirective } from './shared/directives/dom-watcher.directive';

@NgModule({
  declarations: [
    AppComponent,
    VisualizerComponent,
    PlayerComponent,
    HeaderComponent,
    ControlsComponent,
    PlaylistBarComponent,
    StationBarComponent,
    LandingPageComponent,
    RadioPageComponent,
    DomWatcherDirective
  ],
  imports: [
    BrowserModule,
    FontAwesomeModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }