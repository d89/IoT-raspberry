# switchrc

## Purpose

The switchrc module is able to switch remote control power plugs. RC plugs operate on 433MHz frequency and usually come with a remote control. This module replaces the remote control and lets you switch the remote control plugs via your Raspberry.

## Components

* I am using this 433MHz sender / receiver pair. Somehow they always come bundled, however for switching remote control plugs, only the sender is necessary: http://www.amazon.de/Aukru-Superregeneration-Transmitter-Modul-receiver-module/dp/B00OLI93IC
* There are 3 different types of remote control plugs. I am using this one (http://www.amazon.de/Brennenstuhl-Funkschalt-Set-1000-Comfort-1507450/dp/B001AX8QUM), a friend of mine uses these ones successfully: http://www.amazon.de/Renkforce-1208457-FUNK-SCHALTSTECKDOSE-RENKFORCE/dp/B0107XCVOM/  

## Install Guide

The excellent library [pi switch](https://github.com/lexruee/pi-switch-python) is used, that needs to be installed like so:

```
pip install pi_switch
```

## Enable and Configure

Put the following block in your ```config.js``` in the ```actors``` section:

```
switchrc: {
    options: {
        //for type A
        switchType: "A",
        first: "00001",
        switches: ["10000", "01000", "00100"]

        //... for type B ...
        switchType: "B",
        address_group: "1",
        switches: ["1", "2", "3"]

        //... or for type C
        switchType: "C",
        family_code: "a",
        group: "1"
        switches: ["1", "2", "2"]
    }
}
```

Be sure to pick the right type for your rc plugs. The ones from Renkforce have a rotary switch to configure the channel, these are of the ```type B```. The ones from Brennenstuhl linked above use dip switches for configuring the channel. They are of the ```type A```.

## Read further

* http://www.knight-of-pi.org/de/preiswerte-hausautomatisierung-mit-dem-raspberry-pi/ (german)
