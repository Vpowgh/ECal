//ECal Plugin for HomeRemote
//Coming events from ICS calendar file
//Developed by Vpow 2022

plugin.Name = "ECal";
plugin.OnChangeRequest = onChangeRequest;
plugin.OnConnect = onConnect;
plugin.OnDisconnect = onDisconnect;
plugin.OnPoll = onPoll;
plugin.OnSynchronizeDevices = onSynchronizeDevices;
plugin.PollingInterval = 43000000; //this is milliseconds, around 12h
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
        var sdate, edate;
        
        //simple check that it is actually calendar file
        startIndex = str.indexOf("BEGIN:VCALENDAR");
        if(startIndex == -1) {
            return;
        }

        while((index = str.indexOf("BEGIN:VEVENT", startIndex)) > -1) { //find start of an event
            var ii;
            
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
                index = ii;
            }
            else {  //if summary is missing then do not add event
                startIndex = endIndex;
                continue;
            }
            
            //add event if all ok
            if( (sdate >= newdate) || ((sdate < newdate) && (edate >= newdate)) ) { //either event is in the future, or has started and event end is the future (multiday event)
                let event = {};
                event.date = sdate;
                event.year = parseInt(sdate.substr(0,4));
                event.month = parseInt(sdate.substr(4,2));
                event.day = parseInt(sdate.substr(6,2));
                event.summary = str.substring(index+8, str.indexOf("\n", index));
                events.push(event);
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
    }
}

function onSynchronizeDevices() {
    var cal1 = new Device();
    cal1.Id = "1";
    cal1.DisplayName = "Event Calender 1";
    cal1.Capabilities = [];
    cal1.Attributes = [
    "eventlist", "event1", "event2", "event3" ,"event4", "event5", "event6", "event7", "event8", "event9", "event10"
    ];

    plugin.Devices[cal1.Id] = cal1;
}
