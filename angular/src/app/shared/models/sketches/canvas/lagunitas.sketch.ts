import * as d3 from 'd3-interpolate';
import { Sketch } from "../../sketch.model";
import { Time } from "../../time.model";
import { Analysis } from "../../track.model";

export class Lagunitas extends Time implements Sketch {
    name: string = "Lagunitas";
    creator: string = "Captain Brando!";
    offset: number = 0;
    constructor(position: number, analysis: Analysis) {
        super(position, analysis);
    }

    static beatIndex: number = 0;
    static beatSwitch: boolean = false;
    static light: number[] = [-1000, -1000];
    static lightArray: number[] = [0, 1, 2, 3];
    static colors: string[] = ["red", "blue", "yellow", "green", "white", "purple", "orange", "aqua"];
    static chosenColors: string[] = ["green", "orange"];

    paint(ctx: CanvasRenderingContext2D): void {
        // Change the light to flash if a decent beat was hit
        const confidence = this.getBeat();
        if(!Lagunitas.beatSwitch) {
            if(confidence >= .2) {
                ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
                Lagunitas.beatSwitch = true;
                this.getLight(ctx).then(light => {
                    Lagunitas.light = light;
                    Lagunitas.chosenColors = [Lagunitas.colors[Math.floor(Math.random()*Lagunitas.colors.length)], Lagunitas.colors[Math.floor(Math.random()*Lagunitas.colors.length)]];
                    this.refreshLightArray();
                });
            }
        } else {
            if(confidence < .2) {
                Lagunitas.beatSwitch = false;
            }
        }

        ctx.beginPath();
        const color = this.getColor();
        ctx.strokeStyle = color;
        ctx.fillStyle = "yellow";
        ctx.lineWidth = 7;

        // Draw a circle and stroke it in at the current light
        const circleX = Lagunitas.light[0];
        const circleY = Lagunitas.light[1];

        const radius = Math.abs(confidence * 500);
        ctx.arc(circleX, circleY, radius, 0, 2 * Math.PI);

        ctx.stroke();

        ctx.moveTo(0, ctx.canvas.height / 2);

        ctx.closePath();
    }

    static frameKeep: number = 0;
    static frameRate: number = 1;

    loop(ctx: CanvasRenderingContext2D): Promise<any> {
        return new Promise((resolve, reject) => {
            this.paint(ctx);
            // Lagunitas.frameKeep++;
            // if(Lagunitas.frameKeep > Lagunitas.frameRate) {
            //     ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
            //     Lagunitas.frameKeep = 0;
            // }
            resolve(true);
        });
    }

    reset(): void {
        Lagunitas.beatIndex = 0;
        Lagunitas.beatSwitch = false;
        Lagunitas.light = [-1000, -1000];
        Lagunitas.lightArray = [0, 1, 2, 3];
        Lagunitas.chosenColors = [Lagunitas.colors[Math.floor(Math.random()*Lagunitas.colors.length)], Lagunitas.colors[Math.floor(Math.random()*Lagunitas.colors.length)]];
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

    getColor(): string {
        const color_d3 = d3.interpolateLab(Lagunitas.chosenColors[0], Lagunitas.chosenColors[1]);
        const difference = Math.abs(parseFloat((this.position / 1000).toFixed(3)) - this.beat.start);
        return color_d3(Math.abs(difference) / this.beat.duration);
    }

    /**
     * There are four lights, north south east west
     * This function returns one x, y coordinate from the static lightArray
     * 
     * @param ctx canvas context
     * @returns [x, y] array
     */
    getLight(ctx: CanvasRenderingContext2D): Promise<Array<number>> {
        return new Promise((resolve, reject) => {
            const random = Math.floor(Math.random() * Lagunitas.lightArray.length);
            const selected = Lagunitas.lightArray.splice(random, 1);
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            switch(selected[0]) {
                case 0:
                    // west
                    resolve([width / 3, height / 2]);
                    break;
                case 1:
                    // north
                    resolve([width / 2, height / 3]);
                    break;
                case 2:
                    // south
                    resolve([width / 2, height - (height / 3)]);
                    break;
                case 3:
                    // east
                    resolve([width - (width / 3), height / 2]);
                    break;
                default:
                    reject([width / 3, height / 2]);
                    return;
            }
        });
    }

    refreshLightArray(): void {
        if(Lagunitas.lightArray.length === 0) {
            Lagunitas.lightArray = [0, 1, 2, 3];
        }
    }
}
