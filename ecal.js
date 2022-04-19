plugin.Name = "TEST";
plugin.OnChangeRequest = onChangeRequest;
plugin.OnConnect = onConnect;
plugin.OnDisconnect = onDisconnect;
plugin.OnPoll = onPoll;
plugin.OnSynchronizeDevices = onSynchronizeDevices;
plugin.PollingInterval = 100000;
plugin.DefaultSettings = {};

var http = new HTTPClient();

function onChangeRequest(device, attribute, value) {
    switch (attribute) {
        case "Switch":
            device.Switch = value;
            break;
        default:
            break;
    }
}

function onConnect() {
    console.log("TEST connected");
}

function onDisconnect() {
    console.log("TEST disconnected");
}



function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}


function onPoll() {
    console.log("TEST polling");
    try {
        var response = http.get("https://calendar.google.com/calendar/ical/n8e4f4esqukia8a6lui41fq7jg@group.calendar.google.com/public/basic.ics", {responseType : "text"});
    } catch(err) {
        //other than status 200 responses end up here, since HR treats them as exceptions
        console.log(err.message);
    }

    if(typeof response != "undefined") { //200 response received, update cache and last modified info
        var dateObj = new Date();
        var newdate = dateObj.getUTCFullYear() + zeroPad(dateObj.getUTCMonth() + 1, 2) + zeroPad(dateObj.getUTCDate(), 2);

        console.log(newdate);
        
        var str = response.data;
        
        var startIndex = 0, index, indices = [];
            
        while ((index = str.indexOf("DTSTART", startIndex)) > -1) {
            let edate = str.substr(index+8,8);
            if(edate >= newdate) {
                let event = {};
                event.date = str.substr(index+8,8);
                event.year = parseInt(str.substr(index+8,4));
                event.month = parseInt(str.substr(index+12,2));
                event.day = parseInt(str.substr(index+14,2));

                index = str.indexOf("SUMMARY", index);
                event.summary = str.substring(index+8, str.indexOf("\n", index));

                indices.push(event);
            }
            else {
                index = str.indexOf("SUMMARY", index);
            }
            
            startIndex = index;

            //console.log(startIndex);
        }

        indices.sort(function(a, b){return a.date - b.date}); 

       console.log(JSON.stringify(indices));
    }

    var device = plugin.Devices[1];

    //update events
    for(var i=0; (i<indices.length) && (i<4); i++) { 
        device['event'+i] = indices[i].date + " " + indices[i].summary;
    }    
}

function onSynchronizeDevices() {
    var cal1 = new Device();
    cal1.Id = "1";
    cal1.DisplayName = "Event Calender 1";
    cal1.Capabilities = [];
    cal1.Attributes = [
    "event0","event1","event2","event3","event4"
    ];

    plugin.Devices[cal1.Id] = cal1;
}
