# reachability_bluetooth

## Purpose

With this modules help, you can check the reachability of bluetooth devices. The module executes pings to a bluetooth address that you can specify. This is useful for checking, if you are at home (because your smartphone can be found via bluetooth).

## Components

If you own a Rasberry Pi 3, you don't need to buy anything because it comes with bluetooth onboard. If you use a Raspberry Pi 1 or 2, you have to buy one of these guys: http://www.amazon.de/CSL-Bluetooth-Adapter-Technologie-neuester-Standard/dp/B00C68IQ3C
They work right after you plug them via USB. A ```reboot``` might be necessary.

## Install Guide

If you are on a later version Debian Jessie you don't need to enable/install anything.

Test via executing ```hcitool``` and ```l2ping```. If you can execute both, you are good to go. If not, install via

```
apt-get install --no-install-recommends bluetooth
```

## Enable and Configure

You can scan for "normal" Bluetooth devices (like your smartphone, when the bluetooth screen is open) with:

```
hcitool scan
```

Also, it's possible to scan for Bluetooth LE devices (like wearables for example) with:

```
hcitool lescan
```

The Bluetooth Address you get from the ```hcitool scan``` command can be pinged:

```
l2ping -c 1 B8:27:EB:99:A1:CF
```

Note, that you cannot ping Bluetooth LE devices. Additionally to that, there is the ```bluetoothctl``` tool that offers you to pair to devices and do additional things. Try that, if you want. The IoT-client component just depends on ```hcitool``` and ```l2ping``` to check for the availability of a bluetooth device.

Put the following block in your ```config.js``` in the ```sensors``` section:

```
reachability_bluetooth: {
    options: {
        address: "F8:95:C7:73:82:7F", //the bt address of your smartphone (can be found by "hcitool scan")
        interval: 5 //send bluetooth reachability state (1 or 0) every 5 seconds to server
    }
}
```

## Read further

* https://www.element14.com/community/docs/DOC-81266/l/setting-up-bluetooth-on-the-raspberry-pi-3
* https://www.raspberrypi.org/learning/robo-butler/bluetooth-setup/