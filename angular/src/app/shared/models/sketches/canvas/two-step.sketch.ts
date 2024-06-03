import * as d3 from 'd3-interpolate';
import { Sketch } from "../../sketch.model";
import { Time } from "../../time.model";
import { Analysis, Bar, Beat, Tatum } from "../../track.model";
import { getRandomNumber } from 'src/app/utils/numbers';
import { getRandomArrayElement } from 'src/app/utils/arrays';

/**
 * Hey you, you're finally awake
 */
export class TwoStepo extends Time implements Sketch {
    name: string = "2step0";
    creator: string = "Captain Brando!";
    offset: number = 0;
    constructor(position: number, analysis: Analysis) {
        super(position, analysis);
    }

    static colors: string[] = ["#0072B5", "#E9897E", "#00A170", "#926AA6", "#D2386C", "#FDAC53", "#C3447A", "#E15D44"];
    static tatumCount: number = 0;
    static beatCount: number = 0;

    paint(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        const randColor: string = this.getRandomColor();
        ctx.strokeStyle = randColor;
        ctx.fillStyle = randColor;
        ctx.lineWidth = 20;
        const circleX = 40 + getRandomNumber(ctx.canvas.width - 100);
        const circleY = 100 + getRandomNumber(ctx.canvas.height - 100);
        const confidence = this.getConfidence(this.beat);
        const radius = Math.abs(confidence * 750);
        ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }

    static frameKeep: number = 0;
    static frameRate: number = 10;

    loop(ctx: CanvasRenderingContext2D): Promise<any> {
        return new Promise((resolve, reject) => {
            TwoStepo.frameKeep++;
            if(TwoStepo.frameKeep > TwoStepo.frameRate) {
                this.paint(ctx);
                TwoStepo.frameKeep = 0;
            }
            // TwoStepo.frameKeep++;
            if(Time.beatIndex !== TwoStepo.beatCount) {
                ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
                TwoStepo.beatCount = Time.beatIndex;
                // TwoStepo.frameKeep = 0;
            }
            resolve(TwoStepo.frameKeep);
        });
    }

    reset(): void {
        TwoStepo.frameKeep = 0;
    }

    getRandomColor(): string {
        return getRandomArrayElement(TwoStepo.colors);
    }

    getBeat(): number {
        // Confidence is always between 0 and 1
        if(!this.beat) {
            return 0;
        }
        const confidence_d3 = d3.interpolateNumber(.01, this.beat.confidence);
        const difference = Math.abs(this.roundPos(this.position) - this.beat.start);
        return confidence_d3(difference / this.beat.duration);
    }

    /**
     * Let's talk beats...
     * Spotify gives us the timestamp when each beats starts, the confidence, and how long the beat lasts
     * 
     * Every Sketch, and every position, will belong to a beat,
     * but after the start, the beat will (usually) drop in volume until the next one hits
     * 
     * We can use d3-interpolate on the confidence.
     * First we find which beat this position belongs to,
     * next we make a d3 number from the confidence found to 0 (or the lowest value a kick should go)
     * then we use the position to find the percentage of how close we are to the end of the beat
     * position to s = position / 1000 (value of confidence values) (use .toFixed(3) so they have the same amount of decimals)
     * 
     * Example beats:
     * 0: {confidence: 0.831, duration: 0.29325, start: 0.52145}
     * 1: {confidence: 0.602, duration: 0.29007, start: 0.8147}
     * 2: {confidence: 0.633, duration: 0.29368, start: 1.10476}
     * 3: {confidence: 0.32, duration: 0.29292, start: 1.39844}
     */
    
    /**
     * Uses d3-interpolate to find a value between the current beat confidence and 0
     * @param position the current position
     * @returns an interpolated confidence value for the current beat
     */
    getConfidence(type: Beat | Bar | Tatum): number {
        // Confidence is always between 0 and 1
        let confidence_d3 = d3.interpolateNumber(type.confidence, .01);
        let difference = Math.abs(this.roundPos(this.position) - type.start);
        return confidence_d3(difference / type.duration);
    }
}
