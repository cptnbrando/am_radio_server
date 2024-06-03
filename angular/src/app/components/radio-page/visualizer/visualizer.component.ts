import { ElementRef, HostListener, Input, OnChanges, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { SpotifyService } from 'src/app/services/spotify.service';
import { Device } from 'src/app/shared/models/device.model';
import { Sketch } from 'src/app/shared/models/sketch.model';
import { AcidRain } from 'src/app/shared/models/sketches/canvas/acidrain.sketch';
import { Adventure } from 'src/app/shared/models/sketches/canvas/adventure.sketch';
import { RollerCoaster } from 'src/app/shared/models/sketches/canvas/coaster.sketch';
import { Lagunitas } from 'src/app/shared/models/sketches/canvas/lagunitas.sketch';
import { Rain } from 'src/app/shared/models/sketches/canvas/rain.sketch';
import { Testing123 } from 'src/app/shared/models/sketches/canvas/testing123.sketch';
import { TwoStepo } from 'src/app/shared/models/sketches/canvas/two-step.sketch';
import { WalkieTalkie } from 'src/app/shared/models/sketches/canvas/walkie-talkie.sketch';
import { Time } from 'src/app/shared/models/time.model';
import { Analysis, Features, Bar, Beat, Section, Segment, Tatum } from 'src/app/shared/models/track.model';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.scss']
})
export class VisualizerComponent implements OnInit, OnChanges {
  @Input() currentlyPlaying: any = {};
  @Input() isLoading: boolean = true;
  @Input() isPlaying: boolean = false;
  @Input() currentStation: any = {};
  @Input() currentDevice?: Device;

  @Input() selectedPreset: number = 3;

  // Currently playing track analysis and feature data
  analysis!: Analysis;
  features!: Features;

  // Keeping track of track progress for faster array parsing
  sectionMeasures: Array<Bar> = [];
  segmentMeasures: Array<Bar> = [];

  @ViewChild("visualizer", { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D;
  
  position: number = 0;
  animationLoopID: any = 0;
  isAnimating: boolean = false;

  selectedSketch!: Sketch;
  currentSketch!: Sketch;

  @Input() isMobile: boolean = false;
  @Input() am_active: boolean = false;
  @Input() mousePos: Array<number> = [0, 0];
  @Input() showSketchInfo: boolean = true;

  constructor(private spotifyService: SpotifyService) {
    this.position = 0;
  }
  
  ngOnInit(): void {
    this.initCanvas();
  }

  // Start and stop the visualizer based on changes to input values
  ngOnChanges(changes: any): void {
    // We don't care if the mousePos changed
    if(Object.keys(changes).length === 1 && changes.mousePos) return;
    // We never want the visualizer to be playing when nothing's playing
    if(this.currentlyPlaying.name === "Nothing Playing") {
      this.stopVisualizer();
      return;
    }

    // If there's a new track playing, get and set the new analysis/features data
    if(changes.currentlyPlaying?.currentValue.id != changes.currentlyPlaying?.previousValue.id) {
      this.stopVisualizer();
      this.setAudioData(changes.currentlyPlaying?.currentValue.id).then(() => {
        // If it's playing, start the visualizer
        if(this.isPlaying) {
          this.beginVisualizer();
        }
      });
    }

    if(changes.am_active) {
      console.log(this.currentlyPlaying);
      this.resetVisualizer();
    }

    // If isPlaying is changed to false, meaning the player was paused, stop the visualizer. Start it on true
    if(changes.isPlaying?.currentValue === false && !this.isLoading) {
      this.stopVisualizer();
    }
    else if(changes.isPlaying?.currentValue === true && !this.isLoading) {
      this.beginVisualizer();
    }

    // If isLoading is changed to true, stop the visualizer. Start it if it's false
    if(changes.isLoading?.currentValue === true) {
      this.stopVisualizer();
    }
    else if(changes.isLoading?.currentValue === false && this.isPlaying) {
      this.beginVisualizer();
    }

    // If the preset is changed, restart the visualizer loop
    if(changes.selectedPreset) {
      this.resetVisualizer();
    }

    // If the device has changed to something other than am_radio, stop the visualizer
    // if(!this.am_active) {
    //   this.stopVisualizer();
    // }
  }
  
  /**
   * Promise that gets audio analysis and audio features for a given trackID
   * @param trackID track to get
   * @returns audio analysis in promise
   */
  setAudioData(trackID: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.spotifyService.getAudioFeatures(trackID).subscribe((data: Features) => {
        this.features = data;
        // console.log("FEATURES", data);
        this.spotifyService.getAudioAnalysis(trackID).subscribe((data: Analysis) => {
          this.analysis = this.editAnalysisData(data);
          // console.log("ANALYSIS", this.analysis);
          resolve(data);
        }, error => {
          reject(error);
        });
      }, error => {
        reject(error);
      });
    });
  }

  /**
   * We need all values in the array to be rounded to 3 decimal places
   * @param analysis the analysis object
   */
  editAnalysisData(analysis: Analysis): Analysis {
    if(!analysis) {
      return analysis;
    }
    let totalBeatConfidence = 0;
    analysis.beats.map((data: Beat) => {
      data = this.editAudioObject(data);
      totalBeatConfidence += data.confidence;
    });

    Time.beatConfAvg = totalBeatConfidence / analysis.beats.length;

    analysis.bars.map((data: Bar) => {
      data = this.editAudioObject(data);
    });

    this.sectionMeasures = [];
    analysis.sections.map((data: Section) => {
      data.measure = this.editAudioObject(data.measure);
      this.sectionMeasures.push(data.measure);
    });

    this.segmentMeasures = [];
    analysis.segments.map((data: Segment, index: number) => {
      data = this.editSegment(data, analysis, index);
      this.segmentMeasures.push(data.measure);
    });

    analysis.tatums.map((data: Tatum) => {
      data = this.editAudioObject(data);
    });

    return analysis;
  }

  editAudioObject(data: Beat | Bar | Tatum): any {
    data.confidence = parseFloat(data.confidence.toFixed(3));
    data.duration = parseFloat(data.duration.toFixed(3));
    data.start = parseFloat(data.start.toFixed(3));
    return data;
  }

  /**
   * Round all the values to 3 decimal places and fix the loudnessEnd to list the start loudness of the next segment
   * @param data Segment to edit
   * @param analysis Track analysis object
   * @param index Index of segment
   * @returns Segment with rounded loudness values and corrent loudnessEnd values
   */
  editSegment(data: Segment, analysis: Analysis, index: number): Segment {
    if(index < analysis.segments.length - 1) {
      data.loudnessEnd = analysis.segments[index + 1].loudnessStart;
    }
    data.loudnessMaxTime = parseFloat(data.loudnessMaxTime.toFixed(3));
    data.measure = this.editAudioObject(data.measure);
    return data;
  }

  resizeCanvas(): void {
    if(this.canvas) {
      this.canvas.nativeElement.width = window.innerWidth;
      this.canvas.nativeElement.height = window.innerHeight;
    }
    if(this.ctx) {
      this.ctx.canvas.width = window.innerWidth;
      this.ctx.canvas.height = window.innerHeight;
    }
  }
  
  initCanvas(): void {
    this.ctx = <CanvasRenderingContext2D>this.canvas.nativeElement.getContext("2d");
    this.resizeCanvas();
  }

  /**
   * Game loop to render sketches
   */
  render(): void {
    switch(this.am_active) {
      case true:
        this.drawFrame();
        break;
      case false:
        this.drawInactive();
        break;
    }
    this.animationLoopID = window.requestAnimationFrame(this.render.bind(this));
  }

  /**
   * Draw one frame according to a given sketch
   * @param sketch selected sketch
   */
  drawFrame(): void {
    // We can get the exact current position every frame from the spotify sdk web player
    const startTime = performance.now();
    if(this.am_active) {
      (<any>window).spotifyPlayer.getCurrentState().then((data: any) => {
        if(!data) {
          this.stopVisualizer();
          return;
        }
        // It usually takes anywhere between 2 - 15ms to get the position from the player, idk why
        const timeTaken = performance.now() - startTime;
        // timeTaken = 0;
        this.position = data.position + timeTaken;
  
        const sketch = this.sketches(this.selectedPreset, this.position, this.analysis);
        this.currentSketch = sketch;
        
        sketch.setValues(this.position, this.sectionMeasures, this.segmentMeasures).then(() => {
          sketch.loop(this.ctx).then(() => {
            if(this.showSketchInfo) this.drawInfo();
          });
        });
      });
    }
  }

  /**
   * Info to change device to activate visualizer
   */
  drawInactive(): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "white";
    this.ctx.fillStyle = "white";
    this.ctx.font = '15px Source Code Pro';

    this.ctx.fillText(`am_radio inactive`, 20, 100);
    this.ctx.fillText(`(use settings to change device)`, 20, 130);
    this.ctx.closePath();
  }

  /**
   * Draws the selected sketch's info
   */
  drawInfo(): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "white";
    this.ctx.fillStyle = "white";
    this.ctx.font = '15px Source Code Pro';

    // Sketch info
    let sketch = this.sketches(this.selectedPreset, this.position, this.analysis);
    this.ctx.fillText(`Sketch: ${sketch.name}`, 20, 35);
    this.ctx.fillText(`Created By: ${sketch.creator}`, 20, 65);
    // this.ctx.fillText(`Position: ${parseFloat((this.position / 1000).toFixed(3))} : ${this.currentSketch.beat.start}`, 20, 95);
    // this.ctx.fillText(`BeatIndex: ${Time.beatIndex} Beat: ${this.currentSketch.beat.confidence} Start: ${this.currentSketch.beat.start}`, 20, 125);
    // this.ctx.fillText(`TatumIndex: ${Time.tatumIndex} Tatum: ${this.currentSketch.tatum.confidence} Start: ${this.currentSketch.tatum.start}`, 20, 155);
    // this.ctx.fillText(`BarIndex: ${Time.barIndex} Beat: ${this.currentSketch.bar.confidence} Start: ${this.currentSketch.bar.start}`, 20, 185);
    
    // Track info
    this.ctx.fillText(`Now Playing: ${this.currentlyPlaying.name}`, 20, this.ctx.canvas.height - 65);
    this.ctx.fillText(`By: ${this.currentlyPlaying.artists[0].name}`, 20, this.ctx.canvas.height - 35);
    this.ctx.closePath();

    // Station info
    if(this.currentStation.id) {
      this.ctx.fillText(`${this.currentStation.id}`, this.ctx.canvas.width - 500, 35);
    }
  }

  /**
   * Start the visualizer with requestAnimationFrame
   */
  beginVisualizer(): void {
    if(!this.isAnimating && this.analysis && this.features && this.features.uri === this.currentlyPlaying.uri) {
      this.ctx.clearRect(0, 0, this.ctx.canvas.clientWidth, this.ctx.canvas.clientHeight);
      this.selectedSketch = this.sketches(this.selectedPreset, this.position, this.analysis);
      this.isAnimating = true;
      window.requestAnimationFrame(this.render.bind(this));
    }
  }

  /**
   * Stop the visualizer
   */
  stopVisualizer(): Promise<any> {
    return new Promise((resolve, reject) => {
      window.cancelAnimationFrame(this.animationLoopID);
      if(this.selectedSketch && this.selectedSketch!.name) this.selectedSketch.reset();
      if(this.currentSketch && this.currentSketch!.name) this.currentSketch.reset();
      Time.resetTime();
      this.isAnimating = false;
      resolve(this.isAnimating);
    });
  }

  resetVisualizer(): void {
    this.stopVisualizer();
    if(this.isPlaying) {
      this.beginVisualizer();
    }
  }

  /**
   * NEW SKETCH UPDATE THIS
   * 
   * Returns a new sketch of the selected preset
   * @param preset number of preset
   * @param position current position
   * @param analysis track analysis
   * @returns new Sketch
   * 
   * Sketchs:
   * 0 - TestingTesting123
   * 1 - Adventure...!
   * 2 - Lagunitas
   * 3 - Adventure2.0...!
   */
  sketches(preset: number, position: number, analysis: Analysis): Sketch {
    switch(preset) {
      case 0:
        return new Testing123(position, analysis);
      case 1:
        return new Adventure(position, analysis, this.isMobile);
      case 2:
        return new Lagunitas(position, analysis);
      case 3:
        return new RollerCoaster(position, analysis, this.isMobile);
      case 4:
        return new WalkieTalkie(position, analysis, this.isMobile, this.mousePos);
      case 5:
        return new Rain(position, analysis, this.features);
      case 6:
        return new AcidRain(position, analysis, this.features);
      case 7:
        return new TwoStepo(position, analysis);
      default:
        return new Testing123(position, analysis);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.resizeCanvas();
    this.resetVisualizer();
  }
}
