import * as React from 'react';
import 'react-table/react-table.css'
import  './CalendarStyle.css';
import styles from './BookARoom.module.scss';
import { IBookARoomState } from './IBookARoomState';
import '../../WebPartAuthenticationContext';
import * as moment from 'moment';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { EditMeeting } from '../../../common/EditMeeting/EditMeetinng';
import { TokenHandler } from '../../../api/TokenHandler/TokenHandler';
import { EventsApi } from '../../../api/events/api';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MeetingInfo } from '../../../common/MeetingInfo/MeetingInfo';
import { Calendar } from '../../../common/Calendar/Calendar';
import { IBookARoomProps } from './IBookARoomProps';
import { MyEvents } from '../../../common/MyEvents/MyEvents';

export default class BookARoom extends React.Component<IBookARoomProps, IBookARoomState> {
  eventsApi:EventsApi;
  _context:WebPartContext
  constructor(props: IBookARoomProps) {
    super(props);
    this.eventsApi = new EventsApi(props.context);
    this._context = props.context;
    let date = moment();
    this.state = {
      loading: false,
      error: null,
      rooms:[],
      lokations:[],
      showNewMeetinng:false,
      showMeetinngInfo:false,
      meetinng:{
        start:new Date(),
        end:new Date(),
        location:{
          key:'',
          title:''
        },
        attendees:[]
        
      },
      meetinngInfo:null,
      token:null,
      date:date,
      currentWeek:this.getCurrentWeek(date),
      MyEvents:[]
    };
  }
 
  public componentDidUpdate(prevProps: IBookARoomProps, prevState: IBookARoomState, prevContext: any): void {
    if (!prevState.token && !!this.state.token) {
      this.changeDate();
    }
  }

  public render(): React.ReactElement<IBookARoomProps> {
    const loading: JSX.Element = this.state.loading ? <div style={{ margin: '0 auto', width: '7em' }}><div className={styles.spinner}><div className={`${styles.spinnerCircle} ${styles.spinnerNormal}`}></div><div className={styles.spinnerLabel}>Loading...</div></div></div> : <div/>;
    const error: JSX.Element = this.state.error ? <div><strong>Error: </strong> {this.state.error}</div> : <div/>;
    
    return (
      <div className={styles.upcomingMeetings}>
      <TokenHandler 
        onChangeToken = {(token)=>{
          this.setState((prevState: IBookARoomState): IBookARoomState => {
            prevState.token = token;
            return prevState;
          });
        }}
      />
        
        <div className={["ms-Grid-row", styles.RowPadding].join(" ")}>
          <div className="ms-Grid-col ms-sm10">
            <DefaultButton 
              text="<" 
              onClick={ this._PreviousWeek } 
            />
            <div className={styles.CurrentWeek}>
            {this.state.currentWeek}
            </div>
            <DefaultButton 
              text=">" 
              onClick={ this._NextWeek } 
            />
            &nbsp;
            <DefaultButton 
              text="Add Meeting" 
              hidden={ !this.state.rooms.length } 
              onClick={ this._openDialog } 
            />
          </div>
          <div className={["ms-Grid-col ms-sm2", styles.MyEventsHeder].join(" ")}> 
            My Events
          </div>
        </div>
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-sm10">
            <Calendar rooms={this.state.rooms} 
              editItem={(item)=>{ this.editMeeting(item, this) }}
              viewItem={(item)=>{ this.viewMeeting(item, this) }}
              date={this.state.date}
            />
          </div>
          <div className="ms-Grid-col ms-sm2">
          <div className={styles.MyEvents}>
            <MyEvents
              events={this.state.MyEvents}
              editItem={(item)=>{ this.editMeeting(item, this) }}
              viewItem={(item)=>{ this.viewMeeting(item, this) }}
            ></MyEvents>
          </div>
          </div>
        </div>
        
        <EditMeeting
          hidden = { !this.state.showNewMeetinng}
          meeting = { this.state.meetinng }
          lokations = { this.state.lokations}
          onSave = { this.addNewMeeting }
          onClose = { this._closeDialog }
          context = {this._context}
        />
        <MeetingInfo  hidden = { !this.state.showMeetinngInfo}
          meeting = { this.state.meetinngInfo }
          onClose = { this._closeInfoDialog }
          context = {this._context}
        />
        {loading}
        {error}
      </div>
    );
  }

  private editMeeting(item, that:any){
    that.setState((prevState: IBookARoomState, props: IBookARoomProps): IBookARoomState => {
      prevState.meetinng = item;
      prevState.showNewMeetinng = true;
      return prevState;
    });
  }
  private viewMeeting(item, that:any){
    if(!!item){
      that.eventsApi.GetMeetingInfo(that.state.token, item)
      .then((meetinngInfo)=>{
        console.log(meetinngInfo);
        this.setState((prevState: IBookARoomState, props: IBookARoomProps): IBookARoomState => {
          prevState.meetinngInfo = meetinngInfo;
          prevState.showMeetinngInfo = true;
          return prevState;
        });
      })
    }
  }

  private addNewMeeting = (meeteng:any): void => {
    this.eventsApi.AddEvent(this.state.token, meeteng);
    this._closeDialog()
  }
  private _openDialog = (): void => {
    this.setState((prevState: IBookARoomState, props: IBookARoomProps): IBookARoomState => {
      prevState.showNewMeetinng = true;
      return prevState;
    });
  };
  private _closeInfoDialog = (): void => {
    this.setState((prevState: IBookARoomState, props: IBookARoomProps): IBookARoomState => {
      prevState.showMeetinngInfo = false;
      prevState.meetinngInfo = null;
      return prevState;
    });
  };
  private _closeDialog = (): void => {
    this.setState((prevState: IBookARoomState): IBookARoomState => {
      prevState.showNewMeetinng = false;
      prevState.meetinng = {
        start:new Date(),
        end:new Date(),
        location:{
          key:'',
          title:''
        },
        attendees:[]
      };
      return prevState;
    });
  };
  
private _PreviousWeek = (): void => {
  this.changeDate(-7);
}

private _NextWeek = (): void => {
  debugger
  this.changeDate(7);
}
private changeDate(addDays:number=0){
  this.setState((previousState: IBookARoomState): IBookARoomState => {
    if(!!addDays)
      previousState.date = moment(previousState.date, "DD-MM-YYYY").add(addDays, 'days');
    previousState.currentWeek=this.getCurrentWeek(previousState.date);
    previousState.loading = true;
    previousState.lokations = [];
    previousState.rooms = [];
    previousState.MyEvents = [];
    this.loadCalendar(previousState.date);
    return previousState;
  });
  
}
private getCurrentWeek(date:moment.Moment):string{
  let thisDate = date.clone();
  return `${thisDate.startOf('isoWeek').format('MM/DD/YYYY')} - ${moment(thisDate, "DD-MM-YYYY").add(4, 'days').format('MM/DD/YYYY')}`;
}
  private loadCalendar(date:moment.Moment): void {
    this.eventsApi.GetDashboardData(this.state.token, date)
    .then(({rooms,lokations,MyEvents}): void => {
      console.log(rooms,lokations,MyEvents)
      this.setState((prevState: IBookARoomState): IBookARoomState => {
        prevState.lokations = lokations;
        prevState.rooms = rooms;
        prevState.MyEvents = MyEvents;
        prevState.loading = false;
        return prevState;
      });
    }, (error: any): void => {
      this.setState((prevState: IBookARoomState): IBookARoomState => {
        prevState.loading = false;
        prevState.error = error;
        return prevState;
      });
    })
  }
 
  
  


}
