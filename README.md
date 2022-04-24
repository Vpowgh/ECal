# ECal
Plug-in for HomeRemote to fetch and parse ICS calendar file for coming events.

# Features
Reads an ICS calendar file from given URL and parses coming events.

# Settings
In the settings give a valid URL where to fetch ICS calendar file.

# Usage
Import plugin code to HomeRemote project.

The plugin uses following attributes to store data:
>    "eventlist", "event1", "event2", "event3" ,"event4", "event5", "event6", "event7", "event8", "event9", "event10"

"eventlist" contains all future events in JSON format. The other attributes contain the next 10 coming events.

# Release notes
v1.0
- Initial release.
