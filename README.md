# ECal
Plug-in for HomeRemote to fetch and parse ICS calendar file for coming events.

# Features
Reads an ICS calendar file from given URL and parses coming events.

# Settings
In the settings give a valid URL where to fetch ICS calendar file.

Google calendar URLs are of format: https://calendar.google.com/calendar/ical/CALENDAR-ID-HERE/public/basic.ics.

# Usage
Import plugin code to HomeRemote project.

The plugin uses following attributes to store data:
>    "eventlist", "longlist", "event1", "event2", "event3" ,"event4", "event5", "event6", "event7", "event8", "event9", "event10"

"eventlist" contains all future events in JSON format including date and summary. "longlist" is the same than eventlist but adds long description of an event if available. The other attributes contain the next 10 coming events.

"eventlist" and "longlist" can be used for example in HomeRemote GridView component. In ItemsSource put "yourdevice.eventlist" or "yourdevice.longlist" as Device Binding, and in TextMemberPath "event".

# Release notes
v1.1
- Better handling of properties with optional parameters.
- "longlist" with DESCRIPTION field now available.
- Known limitations: recurring events not supported.

v1.0
- Initial release.
