import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faRedo } from '@fortawesome/free-solid-svg-icons';
import { RadioService } from 'src/app/services/radio.service';
import { Station } from 'src/app/shared/models/station.model';

@Component({
  selector: 'stations-panel',
  templateUrl: './stations.component.html',
  styleUrls: ['./stations.component.scss']
})
export class StationsComponent implements OnInit, OnChanges {
  @Input() stationNum: number = 0;
  allStations: Station[] = [];
  @Input() isMobile: boolean = false;
  @Input() isLoading: boolean = false;

  @Output() changeStationEvent = new EventEmitter<number>();

  columns = [
    {
      columnDef: 'id',
      header: '#',
      cell: (element: Station) => `${this.stationNumDisplay(element.stationID)}`,
    },
    {
      columnDef: 'name',
      header: 'Name',
      cell: (element: Station) => `${element.stationName}`,
    },
    {
      columnDef: 'current',
      header: 'Now Playing',
      cell: (element: Station) => (element.current) ? `${element.current.name}` : "Inactive",
    },
    {
      columnDef: 'date',
      header: 'Created On',
      cell: (element: Station) => `${this.stationDateDisplay(element.stationCreated)}`,
    },
    {
      columnDef: 'listeners',
      header: 'Listeners',
      cell: (element: Station) => `${element.listeners.length}`,
    }
  ];

  faRedo = faRedo;

  displayedColumns = this.columns.map(c => c.columnDef);

  constructor(private radioService: RadioService) { }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.isLoading) {
      if(changes.isLoading.currentValue === false) {
        this.refreshStations();
      }
    }
  }

  ngOnInit(): void {
    this.refreshStations();
  }

  refreshStations(): void {
    this.radioService.getAllStations().subscribe(data => {
      // We need the listeners hashmaps as arrays, Java hashmaps return objects so we convert them
      data.map(station => {
        const listeners: any[] = [];
        Object.keys(station.listeners).map(index => {
          listeners.push(station.listeners[index]);
        });
        station.listeners = listeners;
      });
      this.allStations = data;
    });
  }

  changeStation(station: Station): void {
    if(!this.isLoading) {
      this.changeStationEvent.emit(station.stationID);
    }
  }

  /**
   * Prints a JSON date as a legible date
   * @param dateString JSON date
   * @returns formatted date: {month} {dayNum}{suffix} at {hour}:{minute with leading 0}{am/pm}
   */
  stationDateDisplay(dateString: any): string {
    let date = new Date(dateString);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let month = months[date.getMonth()];

    let dayNum = date.getDate();
    let dayNumSuffix = "";
    if(dayNum < 10 || dayNum > 20) {
      switch(dayNum % 10) {
        case 1:
          dayNumSuffix = "st";
          break;
        case 2:
          dayNumSuffix = "nd";
          break;
        case 3:
          dayNumSuffix = "rd";
          break;
        default:
          dayNumSuffix = "th";
      }
    }
    else {
      dayNumSuffix = "th";
    }

    let hours = (date.getHours() < 10) ? `0${Math.floor(date.getHours() / 2)}` : `${Math.floor(date.getHours() / 2)}`;
    let dom = (date.getHours() < 12) ? "am" : "pm";
    const minutes = (date.getMinutes() < 10) ? `0${date.getMinutes()}` : `${date.getMinutes()}`
    let time = `${hours}:${minutes}${dom}`;

    return `${month} ${dayNum}${dayNumSuffix} at ${time}`;
  }

  // Used to format the displayed number into a 000 leading zero varient
  stationNumDisplay(num: number): string {
    if(num < 10) {
      return `00${num}`;
    }
    else if(num < 100) {
      return `0${num}`;
    }
    else {
      return `${num}`;
    }
  }

}
