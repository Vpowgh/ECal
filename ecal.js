//ECal Plugin for HomeRemote
//Coming events from ICS calendar file
//Developed by Vpow 2022

plugin.Name = "ECal";
plugin.OnChangeRequest = onChangeRequest;
plugin.OnConnect = onConnect;
plugin.OnDisconnect = onDisconnect;
plugin.OnPoll = onPoll;
plugin.OnSynchronizeDevices = onSynchronizeDevices;
plugin.PollingInterval = 900000; //this is milliseconds 15min
plugin.DefaultSettings = {"URL": ""};

var http = new HTTPClient();

function onChangeRequest(device, attribute, value) {
}

function onConnect() {
}

function onDisconnect() {
}



function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}


function onPoll() {

    try {
        var response = http.get(plugin.Settings["URL"], {responseType : "text"});
    } catch(err) {
        //other than status 200 responses end up here, since HR treats them as exceptions
        console.log(err.message);
        return;
    }

    if(typeof response != "undefined") { //200 response received
        //create timestamp for current date
        var dateObj = new Date();
        var newdate = dateObj.getUTCFullYear() + zeroPad(dateObj.getUTCMonth() + 1, 2) + zeroPad(dateObj.getUTCDate(), 2);

        var str = response.data;
        var startIndex, endIndex, index, events = [];
        var sdate, edate, udate, ssum, sdes, evdates = [];
        
        //simple check that it is actually calendar file
        startIndex = str.indexOf("BEGIN:VCALENDAR");
        if(startIndex == -1) {
            return;
        }

        while((index = str.indexOf("BEGIN:VEVENT", startIndex)) > -1) { //find start of an event
            var ii, iii;
            
            evdates.length = 0;
            
            //find end of an event, if not found the file is not good
            ii = str.indexOf("END:VEVENT", index);
            if(ii != -1) {
                endIndex = ii;
            }
            else {
                return;
            }
            
            //find startdate within event
            ii = str.indexOf("DTSTART", index);
            if( (ii != -1) && (ii < endIndex) ) {
                ii = str.indexOf(":", ii); //skip possible optional parameters
                sdate = str.substr(ii+1,8);
            }
            else {  //if start time missing go to next event
                startIndex = endIndex;
                continue;
            }
            
            //find enddate within event
            ii = str.indexOf("DTEND", index);
            if( (ii != -1) && (ii < endIndex) ) {
                ii = str.indexOf(":", ii);
                edate = str.substr(ii+1,8); //enddate timestamp
            }
            else {  //if end time missing just use starttime
                edate = sdate;
            }
            
            //find summary within event
            ii = str.indexOf("SUMMARY", index);
            if( (ii != -1) && (ii < endIndex) ) {
                ii = str.indexOf(":", ii);
                ssum = ii+1;
            }
            else {  //if summary is missing then do not add event
                startIndex = endIndex;
                continue;
            }

            //find description within event
            ii = str.indexOf("DESCRIPTION", index);
            if( (ii != -1) && (ii < endIndex) ) {
                ii = str.indexOf(":", ii);
                sdes = ii+1;
            }
            else {  //if description is missing
                sdes = -1;
            }
            
            //find recurrence
            ii = str.indexOf("RRULE", index);
            if( (ii != -1) && (ii < endIndex) ) {
                console.log("recurrent");
                let tmp;
                let freq;
                
                tmp = str.indexOf("FREQ=DAILY", ii);
                if( (tmp != -1) && (tmp < endIndex) ) {
                    freq = 24*60*60*1000; //one day in ms
                    console.log("daily");
                }
                tmp = str.indexOf("FREQ=WEEKLY", ii);
                if( (tmp != -1) && (tmp < endIndex) ) {
                    freq = 7*24*60*60*1000; //one week in ms
                    console.log("weekly");
                }
                tmp = str.indexOf("FREQ=MONTHLY", ii);
                if( (tmp != -1) && (tmp < endIndex) ) {
                    //monthly to be done
                    console.log("monthy");
                }
                
                tmp = str.indexOf("UNTIL=", ii);
                if( (tmp != -1) && (tmp < endIndex) ) {
                    udate = str.substr(tmp+6,8); //untildate timestamp
                    if(udate < newdate) { //all in past, nothing to add
                        startIndex = endIndex;
                        continue;
                    }
                }
                else { //forever.. give it a year from today
                    tmp = parseInt(newdate.substr(0,4))+1;
                    udate = tmp.toString() + newdate.substr(4,4);
                }
                
                let sdate_ms = Date.parse(sdate.substr(0,4) + "-" + sdate.substr(4,2) + "-" + sdate.substr(6,2));
                let udate_ms = Date.parse(udate.substr(0,4) + "-" + udate.substr(4,2) + "-" + udate.substr(6,2));
                let newdate_ms = Date.parse(newdate.substr(0,4) + "-" + newdate.substr(4,2) + "-" + newdate.substr(6,2));
                let recdate = sdate_ms;
                
                do {
                    if(recdate >= newdate_ms) { //take only future dates
                        tmp = new Date(recdate);
                        tmp = tmp.getUTCFullYear() + zeroPad(tmp.getUTCMonth() + 1, 2) + zeroPad(tmp.getUTCDate(), 2);
                        evdates.push(tmp);
                    }
                    recdate = recdate + freq;
                } while(recdate <= udate_ms);
            }
            
            if(evdates.length == 0) { //add single event if there were no recurrent events
                evdates.push(sdate);
            }
            
            
            for(iii=0; iii < evdates.length; iii++) {
                sdate = evdates[iii];
                
                //add event if all ok
                if( (sdate >= newdate) || ((sdate < newdate) && (edate >= newdate)) ) { //either event is in the future, or has started and event end is the future (multiday event)
                    let event = {};
                    event.date = sdate;
                    event.year = parseInt(sdate.substr(0,4));
                    event.month = parseInt(sdate.substr(4,2));
                    event.day = parseInt(sdate.substr(6,2));
                    event.summary = str.substring(ssum, str.indexOf("\r\n", ssum));
       
                    if(sdes != -1) {
                        //unfold description
                        var unfold = 1;
                        ii = sdes;
                        while(unfold) {
                            ii = str.indexOf("\r\n", ii) + 2; //find end of CRLF
                            if(str.charAt(ii) != " ") { //CRLF+space is line separator, just CRLF is end of description
                                unfold = 0;
                            }
                        }

                        //remove line separators and escapes
                        var s = str.substring(sdes, ii);
                        while(s.indexOf("\r\n ") > -1) {
                            s = s.replace("\r\n ","");
                        }
                        while(s.indexOf("\\n") > -1) {
                            s = s.replace("\\n","");
                        }
                        while(s.indexOf("\\") > -1) {
                            s = s.replace("\\","");
                        }

                        //word wrap around 60 chars
                        s = s.replace(/(?![^\n]{1,60}$)([^\n]{1,60})\s/g, '$1\n');
                    }
                    else { //no description available
                        s = "";
                    }
                    event.description = s;

                    events.push(event);
                }
            }
            startIndex = endIndex;
        }

        //sort events based on date
        events.sort(function(a, b){return a.date - b.date}); 

        var device = plugin.Devices[1];

        //update events
        for(var i=0; (i<events.length) && (i<10); i++) { 
            device['event'+(i+1)] = events[i].day + "." + events[i].month + ". " + events[i].summary;
        }
        
        var elist;
        elist = "[";
        for(var i=0; (i<events.length) && (i<500); i++) { //limit to 500 in any case
            elist = elist + "{" + "event:\"" + events[i].day + "." + events[i].month + ". " + events[i].summary + "\"},";
        }
        elist = elist.slice(0,-1) + "]";
        device.eventlist = elist;

        elist = "[";
        for(var i=0; (i<events.length) && (i<500); i++) { //limit to 500 in any case
            elist = elist + "{" + "event:\"" + events[i].day + "." + events[i].month + ". " + events[i].summary + "\\n" + events[i].description + "\"},";
        }
        elist = elist.slice(0,-1) + "]";
        device.longlist = elist;
    }
}

function onSynchronizeDevices() {
    var cal1 = new Device();
    cal1.Id = "1";
    cal1.DisplayName = "Event Calender 1";
    cal1.Capabilities = [];
    cal1.Attributes = [
    "eventlist", "longlist", "event1", "event2", "event3" ,"event4", "event5", "event6", "event7", "event8", "event9", "event10"
    ];

    plugin.Devices[cal1.Id] = cal1;
}
