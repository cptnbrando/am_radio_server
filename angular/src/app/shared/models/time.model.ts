import { Sketch } from "./sketch.model";
import { Beat, Bar, Section, Segment, Tatum, Analysis } from "./track.model";

/**
 * Houses all the calculations for a given Sketch
 */
export class Time {
    // The position in ms
    public position: number;
    public analysis: Analysis;

    // All audio data that can be used in Sketch
    protected beat!: Beat;
    public beatIndex: number = 0;
    protected bar!: Bar;
    public barIndex: number = 0;
    protected section!: Section;
    public sectionIndex: number = 0;
    protected segment!: Segment;
    public segmentIndex: number = 0;
    protected tatum!: Tatum;
    public tatumIndex: number = 0;

    constructor(position: number, analysis: Analysis) {
        this.position = position; 
        this.analysis = analysis;
    }

    /**
     * Parse through the analysis array and find which beat/bar/section/segment/tatum we are given a position
     * @param indexArray [beatIndex, barIndex, sectionIndex, segmentIndex, tatumIndex] for faster array parsing
     * @param sectionMeasures array of all measures of the sections, stored once per track when parsing analysis data
     * @param segmentMeasures array of all measures of the segments, stored once per track when parsing analysis data
     * @returns promise that resolves when all values are
     */
    setValues(indexArray: Array<number>, sectionMeasures: Array<Bar>, segmentMeasures: Array<Bar>): any {
        return new Promise((resolve) => {
            let startTime = performance.now();
            let timeTaken = performance.now() - startTime;
            // Find the beat
            this.find(this.analysis.beats, this.position + timeTaken, indexArray[0]).then(data => {
                this.beat = data[0];
                if(this.beatIndex < data[1]) this.beatIndex = data[1];
            });
            timeTaken = performance.now() - startTime;
            // Find the bar
            this.find(this.analysis.bars, this.position + timeTaken, indexArray[1]).then(data => {
                this.bar = data[0];
                if(this.barIndex < data[1]) this.barIndex = data[1];
            });
            timeTaken = performance.now() - startTime;
            // Find the tatum
            this.find(this.analysis.tatums, this.position + timeTaken, indexArray[4]).then(data => {
                this.tatum = data[0];
                if(this.tatumIndex < data[1]) this.tatumIndex = data[1];
            });
            timeTaken = performance.now() - startTime;
            // Find the section
            this.find(sectionMeasures, this.position + timeTaken, indexArray[2]).then(data => {
                this.section = this.analysis.sections[data[1]];
                if(this.sectionIndex < data[1]) this.sectionIndex = data[1];
            });
            timeTaken = performance.now() - startTime;
            // Find the segment
            this.find(segmentMeasures, this.position + timeTaken, indexArray[2]).then(data => {
                this.segment = this.analysis.segments[data[1]];
                if(this.segmentIndex < data[1]) this.segmentIndex = data[1];
            });
            
            resolve(true);
        });
    }

    /**
     * Find which beat / bar / tatum we are at given a current position and an array of beats/bars/tatums
     * @param patterns Array of track analysis objects
     * @param position The current position
     * @returns Promise for a found beat / bar / tatum
     */
    find(patterns: Array<Beat | Bar | Tatum>, position: number, start?: number): Promise<[(Beat | Bar | Tatum), number]>  {
        return new Promise((resolve) => {
            let roundedPos: number = parseFloat((position / 1000).toFixed(3));
            let count = (start && start > 5) ? (start - 3) : 0;
            let foundIndex = (start) ? start : 0;
            // MASSIVE SHOUTOUT TO THIS ON GOD https://stackoverflow.com/questions/8584902/get-the-closest-number-out-of-an-array
            // also this https://stackoverflow.com/questions/36144406/how-to-early-break-reduce-method
            let robertPATTERNson = patterns.slice(count).reduce((lastPattern, currentPattern, index, arrayCopy) => {
                // Shortcut! If we're past the position, exit out because we've found our value
                if(currentPattern.start > roundedPos) {
                    foundIndex = index - 1;
                    arrayCopy.splice(0);
                    return lastPattern;
                }
                return (Math.abs(currentPattern.start - roundedPos) < Math.abs(lastPattern.start - roundedPos) ? currentPattern : lastPattern);
            });

            // We return the pattern found and it's index in the array
            resolve([robertPATTERNson, foundIndex]);
        });
    }

    roundPos(pos: number): number {
        return parseFloat((pos / 1000).toFixed(3));
    }

    // drawInfo(ctx: CanvasRenderingContext2D, selectedSketch: Sketch, currentlyPlaying: any): void {
    //     ctx.beginPath();
    //     ctx.strokeStyle = "white";
    //     ctx.fillStyle = "white";
    //     ctx.font = '15px Source Code Pro';
    //     // Sketch info
    //     ctx.fillText(`Sketch: ${selectedSketch.name}`, 20, 35);
    //     ctx.fillText(`Created By: ${selectedSketch.creator}`, 20, 65);
    //     // Track info
    //     ctx.fillText(`Now Playing: ${currentlyPlaying.name}`, 20, ctx.canvas.height - 65);
    //     ctx.fillText(`By: ${currentlyPlaying.artists[0].name}`, 20, ctx.canvas.height - 35);
    //     ctx.closePath();
    // }
}
